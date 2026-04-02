package controller

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type RegistrationPolicyError struct {
	MsgKey string
}

func (e *RegistrationPolicyError) Error() string {
	return e.MsgKey
}

func handleRegistrationPolicyError(c *gin.Context, err error) bool {
	registrationErr, ok := err.(*RegistrationPolicyError)
	if !ok {
		return false
	}
	common.ApiErrorI18n(c, registrationErr.MsgKey)
	return true
}

func ensureSelfRegistrationEnabled() error {
	if !common.RegisterEnabled {
		return &RegistrationPolicyError{MsgKey: i18n.MsgUserRegisterDisabled}
	}
	return nil
}

func ensureThirdPartyRegistrationAllowed() error {
	if err := ensureSelfRegistrationEnabled(); err != nil {
		return err
	}
	if common.EmailOnlyRegisterEnabled {
		return &RegistrationPolicyError{MsgKey: i18n.MsgUserThirdPartyRegisterDisabled}
	}
	return nil
}

func resolveRegistrationInviterID(affCode string) (int, error) {
	inviterId, _ := model.GetUserIdByAffCode(strings.TrimSpace(affCode))
	if common.RegisterRequireInviteCode && inviterId == 0 {
		return 0, &RegistrationPolicyError{MsgKey: i18n.MsgInvalidInviteCode}
	}
	return inviterId, nil
}

func resolveThirdPartyRegistrationInviterID(c *gin.Context, session sessions.Session) (int, error) {
	if err := ensureThirdPartyRegistrationAllowed(); err != nil {
		return 0, err
	}
	affCode := strings.TrimSpace(c.Query("aff"))
	if affCode == "" && session != nil {
		if affValue := session.Get("aff"); affValue != nil {
			if aff, ok := affValue.(string); ok {
				affCode = strings.TrimSpace(aff)
			}
		}
	}
	return resolveRegistrationInviterID(affCode)
}
