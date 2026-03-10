import { useRef, useState } from 'react';
import { uploadAttachment, deleteAttachment } from '../services/attachmentService';

const ICON_MAP = {
  pdf:  { icon: '📄', color: '#ef4444' },
  png:  { icon: '🖼', color: '#3b82f6' },
  jpg:  { icon: '🖼', color: '#3b82f6' },
  jpeg: { icon: '🖼', color: '#3b82f6' },
  gif:  { icon: '🖼', color: '#3b82f6' },
  webp: { icon: '🖼', color: '#3b82f6' },
  doc:  { icon: '📝', color: '#2563eb' },
  docx: { icon: '📝', color: '#2563eb' },
  xls:  { icon: '📊', color: '#16a34a' },
  xlsx: { icon: '📊', color: '#16a34a' },
  txt:  { icon: '📃', color: '#6b7280' },
  md:   { icon: '📃', color: '#6b7280' },
};

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ICON_MAP[ext] || { icon: '📎', color: '#6b7280' };
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function AttachmentItem({ attachment, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const { icon, color } = getFileIcon(attachment.filename);

  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment.filename);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        padding:      '10px 12px',
        borderRadius: 'var(--radius-md)',
        background:   hovered ? 'var(--surface-hover)' : 'var(--surface-alt)',
        border:       `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        transition:   'all var(--transition)',
      }}
    >
      {/* Thumbnail or icon */}
      <div
        style={{
          width:        38,
          height:       38,
          borderRadius: 'var(--radius-sm)',
          background:   `${color}18`,
          border:       `1px solid ${color}30`,
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          flexShrink:   0,
          fontSize:     18,
          overflow:     'hidden',
        }}
      >
        {isImage
          ? <img src={attachment.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : icon
        }
      </div>

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attachment.filename}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {new Date(attachment.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.filename}
          title="Download"
          style={{
            width:        28,
            height:       28,
            borderRadius: 'var(--radius-sm)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            color:        'var(--text-muted)',
            transition:   'all var(--transition-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-light)'; e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
        <button
          onClick={async () => { setDeleting(true); await onDelete(attachment.id); }}
          disabled={deleting}
          title="Delete"
          style={{
            width:        28,
            height:       28,
            borderRadius: 'var(--radius-sm)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            color:        'var(--text-muted)',
            cursor:       deleting ? 'wait' : 'pointer',
            transition:   'all var(--transition-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AttachmentUploader({ taskId, initialAttachments = [] }) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [dragging,    setDragging]    = useState(false);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const att = await uploadAttachment(taskId, file);
      setAttachments((prev) => [...prev, att]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Check file type and size (max 20 MB).');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    await deleteAttachment(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border:       `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-hover)'}`,
          borderRadius: 'var(--radius-md)',
          padding:      '20px 16px',
          display:      'flex',
          flexDirection:'column',
          alignItems:   'center',
          gap:          6,
          cursor:       uploading ? 'wait' : 'pointer',
          background:   dragging ? 'rgba(59,130,246,0.05)' : 'var(--surface-alt)',
          transition:   'all var(--transition)',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
          accept="image/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx"
        />
        {uploading ? (
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {uploading ? 'Uploading...' : 'Click or drag a file to upload'}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6 }}>
          Images, PDF, documents, text · Max 20 MB
        </span>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '0.78rem', color: 'var(--danger)', padding: '6px 10px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </p>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map((att) => (
            <AttachmentItem key={att.id} attachment={att} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
