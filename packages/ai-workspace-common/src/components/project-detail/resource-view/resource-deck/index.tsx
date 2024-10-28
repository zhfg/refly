import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer } from 'antd';

import './index.scss';

interface ResourceDeckProps {
  domain: 'resource' | 'canvas';
}

const ResourceDeck = (props: ResourceDeckProps) => {
  const { t } = useTranslation();

  return <div className="resource-deck"></div>;
};

export default ResourceDeck;
