package middleware

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type turnstileCheckResponse struct {
	Success bool `json:"success"`
}

const turnstileUnavailableMessage = "Turnstile 校验服务暂时不可用，请稍后重试！"

func abortTurnstileUnavailable(c *gin.Context, logMsg string) {
	common.SysLog(logMsg)
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": turnstileUnavailableMessage,
	})
	c.Abort()
}

func TurnstileCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		if common.TurnstileCheckEnabled {
			session := sessions.Default(c)
			turnstileChecked := session.Get("turnstile")
			if turnstileChecked != nil {
				c.Next()
				return
			}
			response := c.Query("turnstile")
			if response == "" {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Turnstile token 为空",
				})
				c.Abort()
				return
			}
			if common.TurnstileSecretKey == "" {
				abortTurnstileUnavailable(c, "turnstile verify skipped: secret key is empty")
				return
			}
			client := &http.Client{Timeout: 10 * time.Second}
			rawRes, err := client.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", url.Values{
				"secret":   {common.TurnstileSecretKey},
				"response": {response},
				"remoteip": {c.ClientIP()},
			})
			if err != nil {
				abortTurnstileUnavailable(c, fmt.Sprintf("turnstile verify request failed: %v", err))
				return
			}
			defer rawRes.Body.Close()
			bodyBytes, err := io.ReadAll(rawRes.Body)
			if err != nil {
				abortTurnstileUnavailable(c, fmt.Sprintf("turnstile verify read failed: %v", err))
				return
			}
			if len(bytes.TrimSpace(bodyBytes)) == 0 {
				abortTurnstileUnavailable(c, fmt.Sprintf("turnstile verify returned empty body, status=%d", rawRes.StatusCode))
				return
			}
			if rawRes.StatusCode < http.StatusOK || rawRes.StatusCode >= http.StatusMultipleChoices {
				abortTurnstileUnavailable(c, fmt.Sprintf("turnstile verify unexpected status=%d body=%s", rawRes.StatusCode, string(bodyBytes)))
				return
			}
			var res turnstileCheckResponse
			err = common.Unmarshal(bodyBytes, &res)
			if err != nil {
				abortTurnstileUnavailable(c, fmt.Sprintf("turnstile verify decode failed: status=%d err=%v body=%s", rawRes.StatusCode, err, string(bodyBytes)))
				return
			}
			if !res.Success {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Turnstile 校验失败，请刷新重试！",
				})
				c.Abort()
				return
			}
			session.Set("turnstile", true)
			err = session.Save()
			if err != nil {
				c.JSON(http.StatusOK, gin.H{
					"message": "无法保存会话信息，请重试",
					"success": false,
				})
				return
			}
		}
		c.Next()
	}
}
