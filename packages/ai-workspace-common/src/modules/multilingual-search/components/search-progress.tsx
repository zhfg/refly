import React, { useState, useEffect } from 'react';
import { Timeline, Button, Spin } from 'antd';
import { IconUp, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { useMultilingualSearchStore } from '../stores/multilingual-search';
import './search-progress.scss';

const renderStepResult = (step: string, result: any) => {
  switch (step) {
    case 'rewriteQuery':
      return (
        <ul>
          <li>Rewritten Queries: {result.rewrittenQueries.join(', ')}</li>
          <li>Output Locale: {result.outputLocale}</li>
          <li>Search Locales: {result.searchLocales.join(', ')}</li>
        </ul>
      );

    case 'translateQuery':
      return (
        <ul>
          {Object.entries(result.translatedQueries).map(([locale, queries]: [string, string[]]) => (
            <li key={locale}>
              {locale}: {queries.join(', ')}
            </li>
          ))}
        </ul>
      );

    case 'webSearch':
    case 'translateResults':
      return (
        <ul>
          <li>Results: {result.length}</li>
          <li>Search Locales: {result.localeLength}</li>
        </ul>
      );

    case 'rerank':
      return (
        <ul>
          <li>Final Results: {result.length}</li>
        </ul>
      );

    case 'finish':
      return null;

    default:
      return result ? (
        <ul>
          {Object.entries(result).map(([key, value]) => (
            <li key={key}>
              {key}: {value as string}
            </li>
          ))}
        </ul>
      ) : null;
  }
};

export const SearchProgress: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { searchSteps, isSearching, results, clearSearchSteps, setProcessingStep } = useMultilingualSearchStore(
    (state) => ({
      searchSteps: state.searchSteps,
      isSearching: state.isSearching,
      results: state.results,
      clearSearchSteps: state.clearSearchSteps,
      setProcessingStep: state.setProcessingStep,
    }),
  );

  // Auto expand when searching starts and clear previous steps
  useEffect(() => {
    if (isSearching) {
      setIsExpanded(true);
      clearSearchSteps();
      setProcessingStep();
    } else {
      setIsExpanded(false);
    }
  }, [isSearching, clearSearchSteps]);

  const finishStep = searchSteps.find((step) => step.step === 'finish');
  const summaryText = finishStep ? `${results.length} results (${finishStep.duration}ms)` : 'Processing...';

  console.log('searchSteps', searchSteps);

  return (
    <div className="search-progress">
      <div className="search-progress-header" onClick={() => setIsExpanded(!isExpanded)}>
        <Button type="text" icon={isExpanded ? <IconUp /> : <IconDown />}>
          Search Process - {summaryText}
        </Button>
      </div>
      {isExpanded && (
        <Timeline
          items={searchSteps.map((step, index) => ({
            dot:
              step.step === 'Processing...' ? (
                <Spin indicator={<IconLoading style={{ fontSize: 12, color: '#00968f' }} spin />} />
              ) : undefined,
            children: (
              <div className="step-content">
                <h4>{step.step}</h4>
                {step.result && renderStepResult(step.step, step.result)}
                {step.duration > 0 ? <span className="duration">{step.duration}ms</span> : null}
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
};
