import React, { useState, useEffect } from 'react';
import { Timeline, Button } from 'antd';
import { IconUp, IconDown } from '@arco-design/web-react/icon';
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
  const { searchSteps, isSearching, results } = useMultilingualSearchStore((state) => ({
    searchSteps: state.searchSteps,
    isSearching: state.isSearching,
    results: state.results,
  }));

  // Auto expand when searching starts
  useEffect(() => {
    setIsExpanded(isSearching);
  }, [isSearching]);

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
          items={searchSteps.map((step) => ({
            children: (
              <div className="step-content">
                <h4>{step.step}</h4>
                {step.result && renderStepResult(step.step, step.result)}
                <span className="duration">{step.duration}ms</span>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
};
