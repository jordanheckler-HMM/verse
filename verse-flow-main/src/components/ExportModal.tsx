import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, X, CheckSquare } from 'lucide-react';
import { Section, SECTION_LABELS } from '@/types/song';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  sessionName: string;
  onExportAndEnd: () => void;
}

type ExportFormat = 'txt' | 'md' | 'docx';

export function ExportModal({
  isOpen,
  onClose,
  sections,
  sessionName,
  onExportAndEnd,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('txt');
  const [includeLabels, setIncludeLabels] = useState(true);
  const [includeSyllables, setIncludeSyllables] = useState(false);

  const countSyllables = (text: string): number => {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
    return words.reduce((count, word) => {
      const matches = word.match(/[aeiouy]+/g);
      return count + (matches ? matches.length : 1);
    }, 0);
  };

  const generateTextExport = (): string => {
    let output = '';

    if (format === 'md') {
      output += `# ${sessionName}\n\n`;
    } else {
      output += `${sessionName}\n${'='.repeat(sessionName.length)}\n\n`;
    }

    sections.forEach((section, index) => {
      if (includeLabels) {
        if (format === 'md') {
          output += `## ${section.label}\n`;
        } else {
          output += `[${section.label}]\n`;
        }
      }

      output += section.content;

      if (includeSyllables && section.content.trim()) {
        const syllables = countSyllables(section.content);
        if (format === 'md') {
          output += `\n\n*${syllables} syllables*`;
        } else {
          output += `\n(${syllables} syllables)`;
        }
      }

      if (index < sections.length - 1) {
        output += '\n\n';
      }
    });

    return output;
  };

  const generateDocxExport = async () => {
    const docSections: Paragraph[] = [];

    // Add title
    docSections.push(
      new Paragraph({
        text: sessionName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add each section
    sections.forEach((section, index) => {
      // Section label
      if (includeLabels) {
        docSections.push(
          new Paragraph({
            text: section.label,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );
      }

      // Section content - split by lines
      const lines = section.content.split('\n');
      lines.forEach((line) => {
        docSections.push(
          new Paragraph({
            children: [new TextRun(line || ' ')],
            spacing: { after: 100 },
          })
        );
      });

      // Syllable count
      if (includeSyllables && section.content.trim()) {
        const syllables = countSyllables(section.content);
        docSections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${syllables} syllables`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }

      // Add spacing between sections
      if (index < sections.length - 1) {
        docSections.push(
          new Paragraph({
            text: '',
            spacing: { after: 300 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docSections,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${sessionName.replace(/\s+/g, '-').toLowerCase()}.docx`);
  };

  const handleExport = async () => {
    if (format === 'docx') {
      await generateDocxExport();
    } else {
      const content = generateTextExport();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionName.replace(/\s+/g, '-').toLowerCase()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-soft p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Export Lyrics</h2>
                  <p className="text-sm text-muted-foreground">{sections.length} sections</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Format selection */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Format</label>
                <div className="flex gap-2">
                  {(['txt', 'md', 'docx'] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                        format === f
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      .{f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">Options</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setIncludeLabels(!includeLabels)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                      includeLabels ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    )}>
                      {includeLabels && <CheckSquare className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">Include section labels</span>
                  </button>
                  <button
                    onClick={() => setIncludeSyllables(!includeSyllables)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                      includeSyllables ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    )}>
                      {includeSyllables && <CheckSquare className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">Include syllable counts</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button className="flex-1" onClick={async () => { await handleExport(); onExportAndEnd(); }}>
                Export & End
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/60 text-center mt-4">
              Ending session clears all AI memory
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
