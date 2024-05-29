import React, { useEffect } from "react";
import { useNavigate, useMatch } from "react-router-dom";
import classNames from "classnames";
import { Routing } from "~routes/index";
import { IconSearch, IconStorage } from "@arco-design/web-react/icon";
// stores
import { useUserStore } from "@/stores/user";
import { useHomeStateStore } from "@/stores/home-state";
import { useSelectedMark } from "@/hooks/use-selected-mark";
import { useTranslation } from "react-i18next";
import { useGetUserSettings } from "@/hooks/use-get-user-settings";
import { LOCALE } from "@/types";
import { useProcessStatusCheck } from "@/hooks/use-process-status-check";

export const ContentRouter = () => {
  // 导航相关
  const navigate = useNavigate();
  const isThreadItem = useMatch("/thread/:threadId");
  const userStore = useUserStore();

  const homeStateStore = useHomeStateStore();
  const { handleResetState } = useSelectedMark();

  const { t, i18n } = useTranslation();
  const language = i18n.languages?.[0];

  // 获取 locale
  const locale = userStore?.localSettings?.uiLocale || LOCALE.EN;

  // 这里处理 user 登录和状态管理
  useGetUserSettings();
  // 进行保活检查
  useProcessStatusCheck();

  // TODO: 国际化相关内容
  useEffect(() => {
    if (locale && language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  return (
    <div style={{ height: "100%" }}>
      <Routing />
      {!isThreadItem && userStore.userProfile && (
        <div className="footer-nav-container">
          <div className="footer-nav">
            <div
              className={classNames(
                "nav-item",
                homeStateStore.activeTab === "home" && "nav-item-active"
              )}
              onClick={() => {
                navigate("/");
                homeStateStore.setActiveTab("home");
              }}
            >
              <div className="nav-item-inner">
                <IconSearch style={{ fontSize: 22 }} />
                <p className="nav-item-title">{t("bottomNav.home")}</p>
              </div>
            </div>
            <div
              className={classNames(
                "nav-item",
                homeStateStore.activeTab === "session-library" &&
                  "nav-item-active"
              )}
              onClick={() => {
                navigate("/thread");
                homeStateStore.setActiveTab("session-library");
                handleResetState();
              }}
            >
              <div className="nav-item-inner">
                <IconStorage style={{ fontSize: 22 }} />
                <p className="nav-item-title">{t("bottomNav.threads")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
