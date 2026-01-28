
'use client';

import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { BookOpen, Users, HardHat, Megaphone, CreditCard, ListX, BarChart2, PieChart, ClipboardCheck } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 lg:p-12 bg-transparent text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="admin" />
        
        <div className="mt-12">
             <h2 className="text-2xl font-semibold text-foreground mb-6">{t('adminDashboard.quickActions')}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/classes" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_hsl(var(--secondary))]">
                        <BookOpen className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.manageClasses')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.manageClassesDesc')}</p>
                  </div>
                </Link>

                <Link href="/admin/users" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
                        <Users className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.manageUsers')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.manageUsersDesc')}</p>
                  </div>
                </Link>
                 <Link href="/admin/users?role=staff" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_15px_hsl(var(--accent))]">
                        <HardHat className="w-6 h-6 text-accent" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.manageStaff')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.manageStaffDesc')}</p>
                  </div>
                </Link>

                <Link href="/admin/announcements" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_hsl(var(--secondary))]">
                        <Megaphone className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.notificationsTitle')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.notificationsDesc')}</p>
                  </div>
                </Link>

                <Link href="/admin/fees" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.manageFeesTitle')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.manageFeesDesc')}</p>
                  </div>
                </Link>

                <Link href="/admin/fees/unpaid" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-destructive hover:shadow-xl hover:shadow-destructive/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-destructive/10 rounded-lg transition-all duration-300 group-hover:bg-destructive/20 group-hover:shadow-[0_0_15px_hsl(var(--destructive))]">
                        <ListX className="w-6 h-6 text-destructive" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.unpaidFeesTitle')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.unpaidFeesDesc')}</p>
                  </div>
                </Link>

                <Link href="/admin/reports" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_hsl(var(--secondary))]">
                        <BarChart2 className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.analyticsAndReports')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.analyticsAndReportsDesc')}</p>
                  </div>
                </Link>
                
                 <Link href="/admin/reports/finance" className="group">
                    <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_15px_hsl(var(--accent))]">
                        <PieChart className="w-6 h-6 text-accent" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.financeReport')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.financeReportDesc')}</p>
                    </div>
                </Link>

                <Link href="/admin/grades" className="group">
                    <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_15px_hsl(var(--accent))]">
                        <ClipboardCheck className="w-6 h-6 text-accent" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.viewGrades')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.viewGradesDesc')}</p>
                    </div>
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
