"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/hooks/use-locale";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  copies: number;
  availableCopies: number;
  status: string;
}

interface Issue {
  _id: string;
  book: { title: string; author: string };
  borrower: { name: string; email: string };
  bookTitle: string;
  borrowerName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
  status: string;
}

export default function LibraryPage() {
  const { t } = useLocale();
  const { canAdd, canEdit } = usePermissions("library");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"books" | "issues">("books");
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState({
    total_books: 0,
    total_copies: 0,
    available_copies: 0,
    active_issues: 0,
    overdue: 0,
  });
  const [search, setSearch] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "textbook",
    copies: 1,
    location: "",
    publisher: "",
  });
  const [issueForm, setIssueForm] = useState({
    book_id: "",
    borrower_id: "",
    borrower_type: "student",
    due_date: "",
  });
  const [users, setUsers] = useState<Array<{ _id: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const [bRes, iRes, sRes] = await Promise.all([
        fetch(`/api/library?type=books&${params}`),
        fetch("/api/library?type=issues"),
        fetch("/api/library?type=summary"),
      ]);

      if (bRes.ok) {
        const d = await bRes.json();
        setBooks(d.data || []);
      }
      if (iRes.ok) {
        const d = await iRes.json();
        setIssues(d.data || []);
      }
      if (sRes.ok) {
        const d = await sRes.json();
        setSummary(d.data || {});
      }
    } catch {
      showError(t("common.error"), t("library.failedToFetch"));
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const d = await res.json();
        setUsers(
          d.data?.map((s: { _id: string; name: string }) => ({
            _id: s._id,
            name: s.name,
          })) || [],
        );
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [fetchData, fetchUsers]);

  const addBook = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_book", ...bookForm }),
      });
      if (res.ok) {
        showSuccess(t("common.success"), t("library.bookAdded"));
        setShowAddBook(false);
        setBookForm({
          title: "",
          author: "",
          isbn: "",
          category: "textbook",
          copies: 1,
          location: "",
          publisher: "",
        });
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("library.failedToAddBook"));
    } finally {
      setSubmitting(false);
    }
  };

  const issueBook = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue_book", ...issueForm }),
      });
      if (res.ok) {
        showSuccess(t("common.success"), t("library.bookIssued"));
        setShowIssueDialog(false);
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("library.failedToIssueBook"));
    } finally {
      setSubmitting(false);
    }
  };

  const returnBook = async (issueId: string) => {
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "return_book",
          issue_id: issueId,
          fine: 0,
        }),
      });
      if (res.ok) {
        showSuccess(t("common.success"), t("library.bookReturned"));
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("library.failedToReturnBook"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav.library")}
          </h1>
          <p className="text-muted-foreground">{t("library.description")}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("library.searchBooks")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          {canAdd && (
            <Button onClick={() => setShowAddBook(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("library.addBook")}
            </Button>
          )}
          {canAdd && (
            <Button variant="outline" onClick={() => setShowIssueDialog(true)}>
              <BookOpen className="mr-2 h-4 w-4" />
              {t("library.issueBook")}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          {
            label: t("library.totalBooks"),
            value: summary.total_books,
            color: "text-orange-500 dark:text-orange-400",
          },
          {
            label: t("library.totalCopies"),
            value: summary.total_copies,
            color: "text-amber-600",
          },
          {
            label: t("library.available"),
            value: summary.available_copies,
            color: "text-green-600",
          },
          {
            label: t("library.issued"),
            value: summary.active_issues,
            color: "text-amber-600",
          },
          {
            label: t("library.overdue"),
            value: summary.overdue,
            color: "text-red-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["books", "issues"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === tabKey ? "border-orange-500 text-orange-500 dark:text-orange-400" : "border-transparent text-muted-foreground"}`}
          >
            {tabKey === "books" ? t("library.books") : t("library.issues")}
          </button>
        ))}
      </div>

      {tab === "books" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("library.bookTitle")}</TableHead>
                  <TableHead>{t("library.author")}</TableHead>
                  <TableHead>{t("library.isbn")}</TableHead>
                  <TableHead>{t("library.category")}</TableHead>
                  <TableHead>{t("library.copies")}</TableHead>
                  <TableHead>{t("library.available")}</TableHead>
                  <TableHead>{t("library.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      {t("library.noBooksFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell>{b.author}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {b.isbn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{b.category}</Badge>
                      </TableCell>
                      <TableCell>{b.copies}</TableCell>
                      <TableCell>{b.availableCopies}</TableCell>
                      <TableCell>
                        <Badge
                          variant={b.availableCopies > 0 ? "present" : "absent"}
                        >
                          {b.availableCopies > 0
                            ? t("library.available")
                            : t("library.allIssued")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "issues" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("library.book")}</TableHead>
                  <TableHead>{t("library.borrower")}</TableHead>
                  <TableHead>{t("library.issueDate")}</TableHead>
                  <TableHead>{t("library.dueDate")}</TableHead>
                  <TableHead>{t("library.returnDate")}</TableHead>
                  <TableHead>{t("library.fine")}</TableHead>
                  <TableHead>{t("library.status")}</TableHead>
                  <TableHead>{t("library.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      {t("library.noIssueRecords")}
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((i) => (
                    <TableRow key={i._id}>
                      <TableCell className="font-medium">
                        {i.bookTitle || i.book?.title}
                      </TableCell>
                      <TableCell>
                        {i.borrowerName || i.borrower?.name}
                      </TableCell>
                      <TableCell>
                        {i.issueDate
                          ? new Date(i.issueDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {i.dueDate
                          ? new Date(i.dueDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {i.returnDate
                          ? new Date(i.returnDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{i.fine > 0 ? `₹${i.fine}` : "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            i.status === "returned"
                              ? "present"
                              : i.status === "overdue"
                                ? "absent"
                                : "late"
                          }
                        >
                          {i.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {i.status !== "returned" && canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => returnBook(i._id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            {t("library.return")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Book Dialog */}
      <Dialog open={showAddBook} onOpenChange={setShowAddBook}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("library.addBook")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label>{t("library.bookTitle")}</Label>
              <Input
                value={bookForm.title}
                onChange={(e) =>
                  setBookForm({ ...bookForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("library.author")}</Label>
              <Input
                value={bookForm.author}
                onChange={(e) =>
                  setBookForm({ ...bookForm, author: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("library.isbn")}</Label>
                <Input
                  value={bookForm.isbn}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, isbn: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("library.copies")}</Label>
                <Input
                  type="number"
                  value={bookForm.copies}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, copies: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>{t("library.category")}</Label>
              <Select
                value={bookForm.category}
                onValueChange={(v) => setBookForm({ ...bookForm, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "textbook",
                    "reference",
                    "fiction",
                    "non-fiction",
                    "journal",
                    "magazine",
                    "other",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("library.location")}</Label>
              <Input
                value={bookForm.location}
                onChange={(e) =>
                  setBookForm({ ...bookForm, location: e.target.value })
                }
                placeholder={t("library.locationPlaceholder")}
              />
            </div>
            <Button onClick={addBook} disabled={submitting} className="w-full">
              {submitting ? t("library.adding") : t("library.addBook")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("library.issueBook")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label>{t("library.book")}</Label>
              <Select
                value={issueForm.book_id || undefined}
                onValueChange={(v) =>
                  setIssueForm({ ...issueForm, book_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("library.selectBook")} />
                </SelectTrigger>
                <SelectContent>
                  {books
                    .filter((b) => b.availableCopies > 0)
                    .map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.title} ({b.availableCopies} avail)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("library.borrower")}</Label>
              <Select
                value={issueForm.borrower_id || undefined}
                onValueChange={(v) =>
                  setIssueForm({ ...issueForm, borrower_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("library.selectBorrower")} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("library.dueDate")}</Label>
              <Input
                type="date"
                value={issueForm.due_date}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, due_date: e.target.value })
                }
              />
            </div>
            <Button
              onClick={issueBook}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t("library.issuing") : t("library.issueBook")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
