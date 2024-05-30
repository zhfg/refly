import React, { useEffect, useState } from "react";

// 组件
import {
  List,
  Skeleton,
  Message as message,
  Typography,
} from "@arco-design/web-react";
// stores
import { useThreadStore, type Thread } from "@/stores/thread";
import {
  IconClockCircle,
  IconMessage,
  IconRightCircle,
} from "@arco-design/web-react/icon";
import { useNavigate, useMatch } from "react-router-dom";
// utils
import { time } from "@/utils/time";
// components
import { ChatHeader } from "@/components/home/header";
import { EmptyThreadLibraryStatus } from "@/components/empty-thread-library-status/index";
import { useTranslation } from "react-i18next";
import type { LOCALE } from "@/types";
import classNames from "classnames";
// styles
import "./index.scss";
import { apiRequest } from "@/requests/apiRequest";

export const ThreadLibrary = () => {
  const [scrollLoading, setScrollLoading] = useState(
    <Skeleton animation></Skeleton>
  );
  const threadStore = useThreadStore();
  const navigate = useNavigate();
  const isThreadLibrary = useMatch("/thread");

  const { t, i18n } = useTranslation();
  const uiLocale = i18n?.languages?.[0] as LOCALE;

  const fetchData = async (currentPage = 1) => {
    try {
      console.log("currentPage", currentPage);
      setScrollLoading(
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <Skeleton animation style={{ width: "100%" }}></Skeleton>
          <Skeleton
            animation
            style={{ width: "100%", marginTop: 24 }}
          ></Skeleton>
        </div>
      );
      if (!threadStore?.hasMore && currentPage !== 1) {
        setScrollLoading(<span>{t("threadLibrary.footer.noMoreText")}</span>);
        return;
      }

      // await delay(30000)
      const newRes = await apiRequest({
        name: "getConversationList",
        body: {
          page: currentPage,
          pageSize: 10,
        },
      });

      threadStore.updateCurrentPage(currentPage);
      if (newRes?.data?.length < threadStore?.pageSize) {
        threadStore.updateHasMore(false);
      }

      console.log("newRes", newRes);
      threadStore.updateThreadList(newRes?.data || []);
    } catch (err) {
      message.error(t("threadLibrary.list.fetchErr"));
    } finally {
      const { threads, pageSize } = useThreadStore.getState();

      if (threads?.length === 0) {
        setScrollLoading(<EmptyThreadLibraryStatus />);
      } else if (threads?.length > 0 && threads?.length < pageSize) {
        setScrollLoading(<span>{t("threadLibrary.footer.noMoreText")}</span>);
      }
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      threadStore.resetState();
    };
  }, [isThreadLibrary]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ChatHeader />
      <List
        className="thread-library-list"
        wrapperStyle={{ width: "100%" }}
        bordered={false}
        header={
          <p className="thread-library-title">{t("threadLibrary.title")}</p>
        }
        pagination={false}
        offsetBottom={50}
        dataSource={threadStore?.threads}
        scrollLoading={scrollLoading}
        onReachBottom={(currentPage) => fetchData(currentPage)}
        noDataElement={<div>{t("threadLibrary.list.fetchErr")}</div>}
        render={(item: Thread, index) => (
          <List.Item
            key={index}
            style={{
              padding: "20px 0",
              borderBottom: "1px solid var(--color-fill-3)",
            }}
            actionLayout="vertical"
            actions={[
              <span
                key={1}
                className="thread-library-list-item-continue-ask with-border with-hover"
                onClick={() => {
                  navigate(`/thread/${item?.convId}`);
                }}
              >
                <IconRightCircle style={{ fontSize: 14, color: "#64645F" }} />
                <span
                  className={classNames("thread-library-list-item-text", {
                    "thread-library-list-item-text-en":
                      uiLocale === "en" ? true : FontFaceSetLoadEvent,
                  })}
                >
                  {t("threadLibrary.item.askFollow")}
                </span>
              </span>,
              <span key={2}>
                <IconClockCircle style={{ fontSize: 14, color: "#64645F" }} />
                <span
                  className={classNames("thread-library-list-item-text", {
                    "thread-library-list-item-text-en":
                      uiLocale === "en" ? true : FontFaceSetLoadEvent,
                  })}
                >
                  {time(item.updatedAt).utc().fromNow()}
                </span>
              </span>,
              <span key={3}>
                <IconMessage style={{ fontSize: 14, color: "#64645F" }} />
                <span
                  className={classNames("thread-library-list-item-text", {
                    "thread-library-list-item-text-en":
                      uiLocale === "en" ? true : FontFaceSetLoadEvent,
                  })}
                >
                  {t("threadLibrary.item.messageCount", "", {
                    count: item?.messageCount,
                  })}
                </span>
              </span>,
            ]}
          >
            <List.Item.Meta
              title={item.title}
              description={
                <Typography.Paragraph
                  ellipsis={{ rows: 2, wrapper: "span" }}
                  style={{ color: "rgba(0, 0, 0, .4) !important" }}
                >
                  {item.lastMessage}
                </Typography.Paragraph>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};
