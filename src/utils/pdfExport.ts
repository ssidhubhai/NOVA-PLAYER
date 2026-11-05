import { jsPDF } from 'jspdf';
import { VideoNote } from '../types/player';
import { formatTime } from './formatTime';

interface ExportPdfOptions {
  notes: VideoNote[];
  videoTitle: string;
  courseName?: string;
  authorName?: string;
}

/**
 * Generates and downloads a clean, beautifully formatted Academic & Lecture Study Guide PDF
 * with timestamped lecture notes, concept tags, and captured slide/whiteboard snips.
 */
export async function exportNotesToPdf({
  notes,
  videoTitle,
  courseName = 'Lecture Study Guide',
  authorName = 'Student',
}: ExportPdfOptions): Promise<boolean> {
  if (!notes || notes.length === 0) return false;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Header banner: Deep executive slate navy
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currentY, contentWidth, 75, 'F');

  // Course / Subtitle
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('NOVAPLAY LECTURE STUDY NOTEBOOK', margin + 18, currentY + 22);

  // Main Lecture Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(videoTitle || 'Lecture Notes', contentWidth - 36);
  doc.text(titleLines[0], margin + 18, currentY + 42);

  // Metadata line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Date: ${dateStr}  ·  Notes: ${notes.length}  ·  Student: ${authorName}`, margin + 18, currentY + 62);

  currentY += 95;

  // Count tags for quick summary breakdown
  const tagCounts: Record<string, number> = {};
  notes.forEach((n) => {
    const t = n.tag || 'General';
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  let tagSummaryText = 'Breakdown: ';
  Object.entries(tagCounts).forEach(([tag, count], idx) => {
    tagSummaryText += `${tag}: ${count}${idx < Object.keys(tagCounts).length - 1 ? '  |  ' : ''}`;
  });
  doc.text(tagSummaryText, margin + 12, currentY + 18);

  currentY += 44;

  // Render each note card
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const timestampStr = formatTime(note.timestamp);
    const tag = note.tag || 'General';

    // Measure note text
    const noteTextLines = doc.splitTextToSize(note.text || '(Slide frame captured)', contentWidth - 28);
    const textBlockHeight = noteTextLines.length * 14 + 10;
    const hasImage = Boolean(note.snapshotDataUrl);
    // Large, clear slide photo for studying whiteboard math, slides, and diagrams
    const imgWidth = contentWidth - 28;
    const imgHeight = (imgWidth * 9) / 16; // Standard 16:9 lecture aspect ratio
    const cardPadding = 14;
    const headerHeight = 22;

    const totalItemHeight = headerHeight + textBlockHeight + (hasImage ? imgHeight + 16 : 0) + cardPadding * 2;

    // Check page overflow
    if (currentY + totalItemHeight > pageHeight - margin - 35) {
      doc.addPage();
      currentY = margin + 15;
    }

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(margin, currentY, contentWidth, totalItemHeight, 6, 6, 'FD');

    let innerY = currentY + cardPadding;

    // Timestamp Pill
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin + 12, innerY, 60, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(timestampStr, margin + 42, innerY + 11.5, { align: 'center' });

    // Tag badge with colors
    let tagBg = [226, 232, 240];
    let tagFg = [51, 65, 85];
    if (tag === 'Exam Point') {
      tagBg = [254, 226, 226];
      tagFg = [185, 28, 28];
    } else if (tag === 'Key Concept') {
      tagBg = [209, 250, 229];
      tagFg = [4, 120, 87];
    } else if (tag === 'Formula') {
      tagBg = [224, 231, 255];
      tagFg = [67, 56, 202];
    } else if (tag === 'Question') {
      tagBg = [254, 243, 199];
      tagFg = [180, 83, 9];
    }

    doc.setFillColor(tagBg[0], tagBg[1], tagBg[2]);
    doc.roundedRect(margin + 78, innerY, 74, 16, 3, 3, 'F');
    doc.setTextColor(tagFg[0], tagFg[1], tagFg[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(tag.toUpperCase(), margin + 115, innerY + 11.5, { align: 'center' });

    // Note index
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Point #${i + 1}`, margin + 160, innerY + 11.5);

    innerY += 24;

    // Note Text
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(noteTextLines, margin + 12, innerY + 4);
    innerY += textBlockHeight;

    // Slide Snip Image
    if (hasImage && note.snapshotDataUrl) {
      try {
        doc.addImage(
          note.snapshotDataUrl,
          'PNG',
          margin + 12,
          innerY,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
        innerY += imgHeight + 6;
      } catch {
        // Continue if image parsing fails
      }
    }

    currentY += totalItemHeight + 12;
  }

  // Page numbers on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `NovaPlay Lecture Notes  ·  ${videoTitle}  ·  Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Save the PDF
  const cleanTitle = (videoTitle || 'Lecture_Notes').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Lecture_Notes_${cleanTitle}.pdf`);
  return true;
}
