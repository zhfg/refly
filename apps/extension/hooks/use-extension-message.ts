import { useMessage } from "@plasmohq/messaging/hook"
import React, { type Dispatch, useEffect, useRef, useState } from "react"
import { useSiderStore } from '~stores/sider'

export const useExtensionMessage = () => {
    const siderStore = useSiderStore();

    const extensionMessage = useMessage<
        { name: string; toggle: boolean },
        string
    >((req, res) => {
        res.send(siderStore?.showSider ? "true" : "false")
    })

    // Fix closure issue
    useEffect(() => {
        if (
            extensionMessage?.data?.name === "runRefly" &&
            extensionMessage?.data?.toggle
        ) {
            siderStore.setShowSider(!siderStore?.showSider)
        }
    }, [extensionMessage?.data])
}
