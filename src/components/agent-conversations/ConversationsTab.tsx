// ABOUTME: Shared admin conversation browser for any agent's chatbot_conversations
// ABOUTME: Paginated table with search, date filter, summary stats, and detail dialog

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Search,
  MessageSquare,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MessagesSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchConversations, type ConversationRecord, type FetchConversationsOptions } from '@/services/conversationService';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { ConversationDetailDialog } from './ConversationDetailDialog';

const PAGE_SIZE = 25;

interface ConversationsTabProps {
  agent: string;
  agentLabel: string;
}

export function ConversationsTab({ agent, agentLabel }: ConversationsTabProps) {
  const [page, setPage] = useState(0);
  const [daysFilter, setDaysFilter] = useState<string>('30');
  const [sortBy, setSortBy] = useState<FetchConversationsOptions['sortBy']>('updated_at');
  const [sortAsc, setSortAsc] = useState(false);
  const { query: searchQuery, setQuery: setSearchQuery, debouncedQuery } = useDebounceSearch();

  const [selectedConversation, setSelectedConversation] = useState<ConversationRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [`${agent}-conversations`, page, debouncedQuery, daysFilter, sortBy, sortAsc],
    queryFn: () => fetchConversations({
      agent,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      search: debouncedQuery || undefined,
      daysBack: daysFilter !== 'all' ? Number(daysFilter) : undefined,
      sortBy,
      sortAsc,
    }),
  });

  function toggleSort(col: FetchConversationsOptions['sortBy']) {
    if (sortBy === col) {
      setSortAsc(a => !a);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
    setPage(0);
  }

  function SortIcon({ col }: { col: FetchConversationsOptions['sortBy'] }) {
    if (sortBy !== col) return null;
    return sortAsc ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />;
  }

  const conversations = data?.conversations ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Summary stats from current page (only conversations with messages)
  const withMessages = conversations.filter(c => c.message_count > 0);
  const avgMessages = withMessages.length > 0
    ? Math.round(withMessages.reduce((sum, c) => sum + c.message_count, 0) / withMessages.length)
    : 0;
  const avgToolCalls = withMessages.length > 0
    ? Math.round(withMessages.reduce((sum, c) => sum + c.tool_calls_count, 0) / withMessages.length)
    : 0;

  function getPreview(c: ConversationRecord): string {
    const firstUserMsg = c.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      return firstUserMsg.content.length > 80
        ? firstUserMsg.content.slice(0, 80) + '…'
        : firstUserMsg.content;
    }
    const firstMsg = c.messages[0];
    if (firstMsg) {
      return firstMsg.content.length > 80
        ? firstMsg.content.slice(0, 80) + '…'
        : firstMsg.content;
    }
    return '--';
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMessages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Tool Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {avgToolCalls}
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search user or message content..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={daysFilter} onValueChange={(v) => { setDaysFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('updated_at')}
                >
                  Date<SortIcon col="updated_at" />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead className="text-center">Messages</TableHead>
                <TableHead className="text-center">Tool Calls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading conversations...
                  </TableCell>
                </TableRow>
              ) : conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <MessagesSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No conversations found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                conversations.map((conv) => (
                  <TableRow
                    key={conv.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => { setSelectedConversation(conv); setDetailOpen(true); }}
                  >
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(conv.updated_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{conv.user_name}</div>
                      {conv.user_email && (
                        <div className="text-xs text-muted-foreground">{conv.user_email}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate text-muted-foreground">
                      {getPreview(conv)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        {conv.message_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {conv.tool_calls_count > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          {conv.tool_calls_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <ConversationDetailDialog
        conversation={selectedConversation}
        agentLabel={agentLabel}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
