'use client';

import { useMemo, useState } from 'react';
import { SurveysAiFirstHero } from '@/components/surveys/SurveysAiFirstHero';
import { SurveyFolderSidebar } from '@/components/surveys/SurveyFolderSidebar';
import { SurveysList } from '@/components/surveys/SurveysList';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  MOCK_SURVEY_FOLDERS,
  MOCK_SURVEYS,
  SURVEY_TOTAL_COUNT,
  SURVEYS_PAGE_SIZE,
} from '@/data/mock-surveys';
import styles from './SurveysPage.module.css';

export default function SurveysPage() {
  const wick = useWickUILib();
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);

  const filteredSurveys = useMemo(() => {
    if (selectedFolderId === 'all') return MOCK_SURVEYS;
    return MOCK_SURVEYS.filter((survey) => survey.folderId === selectedFolderId);
  }, [selectedFolderId]);

  if (!wick) {
    return null;
  }

  const displayTotal = selectedFolderId === 'all' ? SURVEY_TOTAL_COUNT : filteredSurveys.length;
  const rangeEnd = Math.min(SURVEYS_PAGE_SIZE, displayTotal);

  return (
    <div className={styles.page}>
      <div className={styles.workspaceBody}>
        <SurveyFolderSidebar
          folders={MOCK_SURVEY_FOLDERS}
          selectedFolderId={selectedFolderId}
          collapsed={foldersCollapsed}
          onCollapse={() => setFoldersCollapsed(true)}
          onExpand={() => setFoldersCollapsed(false)}
          onSelectFolder={setSelectedFolderId}
        />
        <div className={styles.main} data-surveys-main>
          <SurveysAiFirstHero />
          <SurveysList
            key={selectedFolderId}
            surveys={filteredSurveys}
            displayTotal={displayTotal}
            rangeEnd={rangeEnd}
            foldersCollapsed={foldersCollapsed}
            onExpandFolders={() => setFoldersCollapsed(false)}
            onCollapseFolders={() => setFoldersCollapsed(true)}
          />
        </div>
      </div>
    </div>
  );
}
