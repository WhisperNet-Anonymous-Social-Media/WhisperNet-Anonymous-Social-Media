import React, { useState } from 'react';
import { AdminReportsTable } from '@/components/AdminReportsTable';
import { mockReportedPosts, ReportedPost } from '@/lib/dummyData';

export const AdminDashboardPage: React.FC = () => {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>(mockReportedPosts);

  const handleUpdateReport = (id: string, updates: Partial<ReportedPost>) => {
    setReportedPosts(prev =>
      prev.map(post =>
        post.id === id
          ? { ...post, ...updates }
          : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Monitor and manage reported content to maintain community safety.
          </p>
        </div>

        {/* Reports Table */}
        <AdminReportsTable
          reportedPosts={reportedPosts}
          onUpdateReport={handleUpdateReport}
        />

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p className="font-semibold">WhisperNet Admin Panel</p>
          <p className="mt-1">All moderation actions are logged for transparency and accountability.</p>
        </div>
      </div>
    </div>
  );
};