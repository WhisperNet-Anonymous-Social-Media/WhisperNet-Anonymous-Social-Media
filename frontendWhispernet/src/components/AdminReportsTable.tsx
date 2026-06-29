import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, X, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle, Shield } from 'lucide-react';
import { ReportedPost } from '@/lib/dummyData';
import { useToast } from '@/hooks/use-toast';

interface AdminReportsTableProps {
  reportedPosts: ReportedPost[];
  onUpdateReport: (id: string, updates: Partial<ReportedPost>) => void;
}

export const AdminReportsTable: React.FC<AdminReportsTableProps> = ({ 
  reportedPosts, 
  onUpdateReport 
}) => {
  const [selectedPost, setSelectedPost] = useState<ReportedPost | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'dismiss' | 'delete'>('dismiss');
  const { toast } = useToast();

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/50 dark:border-orange-800">
            <Clock className="w-3 h-3 mr-1.5" />
            Pending
          </Badge>
        );
      case 'dismissed':
        return (
          <Badge variant="outline" className="text-muted-foreground border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
            <X className="w-3 h-3 mr-1.5" />
            Dismissed
          </Badge>
        );
      case 'deleted':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/50 dark:border-red-800">
            <Trash2 className="w-3 h-3 mr-1.5" />
            Deleted
          </Badge>
        );
      default:
        return null;
    }
  };

  const getReason = (reason: string) => {
    const reasonColors: { [key: string]: string } = {
      'Personal attack/harassment': 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
      'Academic dishonesty': 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800',
      'Hate speech/discrimination': 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:border-orange-800',
      'Spam/off-topic': 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs font-medium ${reasonColors[reason] || 'text-gray-600 bg-gray-50 border-gray-200'}`}
      >
        {reason}
      </Badge>
    );
  };

  const handleAction = (post: ReportedPost, type: 'dismiss' | 'delete') => {
    setSelectedPost(post);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedPost) return;

    const newStatus = actionType === 'dismiss' ? 'dismissed' : 'deleted';
    onUpdateReport(selectedPost.id, { status: newStatus });

    toast({
      title: actionType === 'dismiss' ? "Report dismissed" : "Post deleted",
      description: actionType === 'dismiss' 
        ? "The report has been dismissed and marked as resolved."
        : "The post has been deleted and the user has been notified.",
    });

    setActionDialogOpen(false);
    setSelectedPost(null);
  };

  const pendingReports = reportedPosts.filter(post => post.status === 'pending');
  const resolvedReports = reportedPosts.filter(post => post.status !== 'pending');

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedReports.length}</div>
            <p className="text-xs text-muted-foreground">Dismissed or deleted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportedPosts.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reported Posts Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Post Content</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportedPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No reported posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  reportedPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium text-sm">
                        {post.reportedBy}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate text-sm text-muted-foreground">
                            "{post.postContent}"
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getReason(post.reason)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(post.timestamp)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {post.status === 'pending' ? (
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(post, 'dismiss')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction(post, 'delete')}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Resolved</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {actionType === 'dismiss' ? (
                <X className="w-5 h-5 mr-2 text-muted-foreground" />
              ) : (
                <Trash2 className="w-5 h-5 mr-2 text-destructive" />
              )}
              {actionType === 'dismiss' ? 'Confirm Dismissal' : 'Confirm Deletion'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'dismiss'
                ? 'Are you sure you want to dismiss this report? This will mark it as resolved.'
                : 'Are you sure you want to delete this post? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="bg-muted/50 rounded-lg p-4 my-4 space-y-3">
              <div className="text-sm">
                <span className="font-medium text-foreground">Post Content: </span>
                <span className="text-muted-foreground italic">"{selectedPost.postContent}"</span>
              </div>
               <div className="text-sm">
                <span className="font-medium text-foreground">Reason: </span>
                {getReason(selectedPost.reason)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'dismiss' ? 'secondary' : 'destructive'}
              onClick={confirmAction}
            >
              {actionType === 'dismiss' ? 'Confirm Dismiss' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};