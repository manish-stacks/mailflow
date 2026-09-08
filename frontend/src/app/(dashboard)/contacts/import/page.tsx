'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, FileSpreadsheet, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { ContactList, ImportJob } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Select } from '@/components/ui/primitives';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { toast } from '@/components/ui/feedback';

const TARGETS = [
  { value: 'email', label: 'Email' },
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'phone', label: 'Phone' },
  { value: 'skip', label: 'Skip this column' },
];

const STEPS = ['Upload', 'Map columns', 'Import'];

export default function ImportContactsPage() {
  const router = useRouter();
  const wsId = useAuth((s) => s.activeWorkspace?.id);
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<{ fileId: string; fileName: string; headers: string[]; sample: string[][]; suggestedMapping: Record<string, string> } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [listId, setListId] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  const lists = useQuery({ queryKey: ['lists', wsId], queryFn: () => api.get<ContactList[]>('/lists'), enabled: !!wsId });

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.upload<any>('/contacts/import/upload', form);
    },
    onSuccess: (data) => {
      setParsed(data);
      setMapping(data.suggestedMapping);
      setStep(1);
    },
    onError: (e: any) => toast.error('Could not read that file', e.message),
  });

  const start = useMutation({
    mutationFn: () => api.post<ImportJob>('/contacts/import', { fileId: parsed!.fileId, listId: listId || undefined, mapping }),
    onSuccess: (job) => { setJobId(job.id); setStep(2); },
    onError: (e: any) => toast.error('Import could not start', e.message),
  });

  const job = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: () => api.get<ImportJob>(`/contacts/import/${jobId}`),
    enabled: !!jobId,
    refetchInterval: (q) => (['completed', 'failed'].includes((q.state.data as ImportJob)?.status) ? false : 1500),
  });

  useEffect(() => {
    if (job.data?.status === 'completed') toast.success('Import finished', `${formatNumber(job.data.importedRows)} contacts imported.`);
  }, [job.data?.status]);

  const emailMapped = Object.values(mapping).includes('email');

  return (
    <div className="space-y-6">
      <PageHeader title="Import contacts" description="Upload a CSV, map your columns, and we will import in the background." />

      <div className="flex items-center gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
              i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-accent text-accent-foreground ring-2 ring-primary' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`hidden text-sm sm:block ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardContent className="p-10">
            <button
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-12 transition hover:border-primary hover:bg-accent/40"
            >
              <div className="rounded-full bg-accent p-4"><Upload className="h-6 w-6 text-accent-foreground" /></div>
              <p className="font-medium">{upload.isPending ? 'Reading your file…' : 'Choose a CSV file'}</p>
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                The first row must contain column headers. Files up to 50 MB are supported.
              </p>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => e.target.files?.[0] && upload.mutate(e.target.files[0])}
            />
          </CardContent>
        </Card>
      )}

      {step === 1 && parsed && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" /> {parsed.fileName}</CardTitle>
              <CardDescription>Tell us what each column contains. Unmapped columns become custom attributes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {parsed.headers.map((h) => (
                  <div key={h} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h}</p>
                      <p className="truncate text-xs text-muted-foreground">{parsed.sample[0]?.[parsed.headers.indexOf(h)] || '—'}</p>
                    </div>
                    <Select
                      className="w-40"
                      value={TARGETS.some((t) => t.value === mapping[h]) ? mapping[h] : 'custom'}
                      onChange={(e) => setMapping({
                        ...mapping,
                        [h]: e.target.value === 'custom'
                          ? `custom_attributes.${h.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
                          : e.target.value,
                      })}
                    >
                      {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      <option value="custom">Custom attribute</option>
                    </Select>
                  </div>
                ))}
              </div>

              <Field label="Add imported contacts to a list (optional)">
                <Select value={listId} onChange={(e) => setListId(e.target.value)}>
                  <option value="">No list</option>
                  {lists.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </Field>

              {!emailMapped && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Map one column to Email before continuing.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preview</CardTitle><CardDescription>First rows from your file.</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead><TR>{parsed.headers.map((h) => <TH key={h}>{h}</TH>)}</TR></THead>
                <TBody>
                  {parsed.sample.slice(0, 5).map((row, i) => (
                    <TR key={i}>{parsed.headers.map((_, c) => <TD key={c} className="text-sm">{row[c] || '—'}</TD>)}</TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setStep(0); setParsed(null); }}>Back</Button>
            <Button disabled={!emailMapped} loading={start.isPending} onClick={() => start.mutate()}>Start import</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{job.data?.status === 'completed' ? 'Import complete' : job.data?.status === 'failed' ? 'Import failed' : 'Importing…'}</CardTitle>
            <CardDescription>
              {job.data?.status === 'completed'
                ? 'Your contacts are now available.'
                : 'This runs in the background — you can leave this page.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['Total rows', job.data?.totalRows], ['Valid', job.data?.validRows], ['Invalid', job.data?.invalidRows],
                ['Duplicates', job.data?.duplicateRows], ['Imported', job.data?.importedRows], ['Failed', job.data?.failedRows],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold">{formatNumber(value as number)}</p>
                </div>
              ))}
            </div>

            {!!job.data?.errors?.length && (
              <div className="rounded-lg border border-border">
                <p className="border-b border-border px-4 py-2 text-sm font-medium">Rows we skipped</p>
                <ul className="max-h-52 divide-y divide-border overflow-y-auto text-sm">
                  {job.data.errors.slice(0, 50).map((e: any, i: number) => (
                    <li key={i} className="flex justify-between gap-4 px-4 py-2">
                      <span className="truncate text-muted-foreground">Row {e.row}: {e.email || '—'}</span>
                      <span className="shrink-0 text-destructive">{e.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => router.push('/contacts')}>View contacts</Button>
              <Button variant="outline" onClick={() => { setStep(0); setParsed(null); setJobId(null); }}>Import another file</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
