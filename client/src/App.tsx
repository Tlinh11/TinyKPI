import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { LoginPage } from './pages/LoginPage.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { StrategyAssessmentPage } from './pages/StrategyAssessmentPage.js';
import { SwotAnalysisPage } from './pages/SwotAnalysisPage.js';
import { StrategyFormulationPage } from './pages/StrategyFormulationPage.js';
import { StrategyMapPage } from './pages/StrategyMapPage.js';
import { BscScorecardPage } from './pages/BscScorecardPage.js';
import { EmployeesPage } from './pages/EmployeesPage.js';
import { DepartmentsPage } from './pages/DepartmentsPage.js';
import { PositionsPage } from './pages/PositionsPage.js';
import { MasterProcessPage } from './pages/MasterProcessPage.js';
import { SlaPage } from './pages/SlaPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { MonitoringPage } from './pages/MonitoringPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { ExamBankPage } from './pages/ExamBankPage.js';
import { ExamsPage } from './pages/ExamsPage.js';
import { TrainingPage } from './pages/TrainingPage.js';
import { RolesPage } from './pages/RolesPage.js';
import { OrgChartPage } from './pages/OrgChartPage.js';
import { LeaveRecordsPage } from './pages/LeaveRecordsPage.js';
import { FormsPage } from './pages/FormsPage.js';
import { AiRulesPage } from './pages/AiRulesPage.js';
import { EmailSettingsPage } from './pages/EmailSettingsPage.js';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/dashboard';
      setCurrentPath(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1677ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Đang khởi động hệ thống TinyKPI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard/step1':
        return <StrategyAssessmentPage onNavigate={navigateTo} />;
      case '/swot':
        return <SwotAnalysisPage onNavigate={navigateTo} />;
      case '/strategy-formulation':
        return <StrategyFormulationPage onNavigate={navigateTo} />;
      case '/strategy-map':
        return <StrategyMapPage onNavigate={navigateTo} />;
      case '/bsc-scorecard':
        return <BscScorecardPage onNavigate={navigateTo} />;
      case '/employees':
        return <EmployeesPage />;
      case '/departments':
        return <DepartmentsPage />;
      case '/positions':
        return <PositionsPage />;
      case '/master-process':
        return <MasterProcessPage />;
      case '/sla':
        return <SlaPage />;
      case '/audit-logs':
        return <AuditLogsPage />;
      case '/tasks':
        return <TasksPage onNavigate={navigateTo} />;
      case '/calendar':
        return <CalendarPage onNavigate={navigateTo} />;
      case '/monitoring':
        return <MonitoringPage onNavigate={navigateTo} />;
      case '/reports':
        return <ReportsPage onNavigate={navigateTo} />;
      case '/exam-bank':
        return <ExamBankPage onNavigate={navigateTo} />;
      case '/exams':
        return <ExamsPage onNavigate={navigateTo} />;
      case '/training':
        return <TrainingPage onNavigate={navigateTo} />;
      case '/roles':
        return <RolesPage />;
      case '/org-chart':
        return <OrgChartPage />;
      case '/employees/on-leave':
        return <LeaveRecordsPage />;
      case '/forms':
        return <FormsPage />;
      case '/ai-rules':
        return <AiRulesPage />;
      case '/email-settings':
        return <EmailSettingsPage />;
      case '/dashboard':
      default:
        return <DashboardPage onNavigate={navigateTo} />;
    }
  };

  return (
    <MainLayout currentPath={currentPath} onNavigate={navigateTo}>
      {renderContent()}
    </MainLayout>
  );
};
