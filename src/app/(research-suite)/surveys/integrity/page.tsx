'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SurveyProtectionDashboard } from '@/components/integrity/SurveyProtectionDashboard';
import { SurveyFolderSidebar } from '@/components/surveys/SurveyFolderSidebar';
import { MOCK_SURVEY_FOLDERS } from '@/data/mock-surveys';
import styles from '../SurveysPage.module.css';

export default function SurveyIntegrityPage() {
  const router = useRouter();
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.workspaceBody}>
        <SurveyFolderSidebar
          folders={MOCK_SURVEY_FOLDERS}
          selectedFolderId=""
          collapsed={foldersCollapsed}
          onCollapse={() => setFoldersCollapsed(true)}
          onExpand={() => setFoldersCollapsed(false)}
          onSelectFolder={() => router.push('/surveys')}
        />
        <div className={styles.main}>
          <Suspense>
            <SurveyProtectionDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
