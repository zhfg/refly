import { useSearchParams, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useHandlePaymentCallback = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // 添加支付状态检查
  useEffect(() => {
    const paySuccess = searchParams.get('paySuccess');
    const payCancel = searchParams.get('payCancel');
    if (paySuccess || payCancel) {
      setTimeout(() => {
        const title = paySuccess ? t('settings.action.paySuccessNotify') : t('settings.action.payCancelNotify');
        const description = paySuccess
          ? t('settings.action.paySuccessDescription')
          : t('settings.action.payCancelDescription');
        if (paySuccess) {
          Modal.success({
            title,
            content: description,
          });
        } else {
          Modal.error({
            title,
            content: description,
          });
        }

        // 删除支付相关参数但保持在当前页面
        searchParams.delete('paySuccess');
        searchParams.delete('payCancel');
        navigate(`${window.location.pathname}?${searchParams.toString()}`, {
          replace: true,
        });
      }, 1);
    }
  }, [searchParams, t, navigate]);
};
