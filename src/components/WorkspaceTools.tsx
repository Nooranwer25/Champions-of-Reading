import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Mail, Calendar as CalendarIcon, CheckSquare, FileText, Loader2, ExternalLink, Zap, MessageSquare, StickyNote } from 'lucide-react';
import { getAccessToken } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';

export const WorkspaceTools: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const checkAuth = async () => {
    const token = getAccessToken();
    if (!token) {
      showToast({ title: 'Authentication Error', description: 'Missing Workspace token. Please sign out and sign in again.', type: 'error' });
      return null;
    }
    return token;
  };

  const exportToDrive = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm("Export your reading report to Google Drive?")) return;

    setLoading('drive');
    try {
      const content = "Colony Reading Report\n\nGenerated for: " + (user?.displayName || 'Sorcerer') + "\nDate: " + new Date().toISOString() + "\n\nTotal Tomes: ...\nCursed Energy: ...";
      
      const metadata = {
        name: 'Colony_Reading_Report.txt',
        mimeType: 'text/plain',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'text/plain' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (!res.ok) throw new Error('Failed to upload file to Drive');
      
      showToast({ title: 'Export Complete', description: 'Report successfully exported to Google Drive.', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Drive Export Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const sendEmail = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm(`Send an update email to ${user?.email}?`)) return;

    setLoading('gmail');
    try {
      const emailContent = [
        `To: ${user?.email}`,
        `Subject: The Colony: Newsletter & Updates`,
        '',
        'Fellow Sorcerer,\n\nHere are your latest updates from the Cursed Archive. Keep reading to increase your rank!\n\n- The Oracle'
      ].join('\r\n');

      const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!res.ok) throw new Error('Failed to send email');
      showToast({ title: 'Email Sent', description: 'Newsletter sent to your address!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Email Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const scheduleReminder = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm("Schedule a reading reminder tournament in Google Calendar?")) return;

    setLoading('calendar');
    try {
      const event = {
        summary: 'Reading Tournament - The Colony',
        description: 'Time to read your assigned tomes to gather Cursed Energy.',
        start: {
          dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1h
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!res.ok) throw new Error('Failed to create event');
      showToast({ title: 'Calendar Updated', description: 'Tournament reminder added to your Calendar!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Scheduling Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const addQuest = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm("Add a daily reading quest to Google Tasks?")) return;

    setLoading('tasks');
    try {
      // First, get the default task list
      const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lists = await listsRes.json();
      const taskListId = lists.items?.[0]?.id;

      if (!taskListId) throw new Error("Could not find a task list.");

      const task = {
        title: 'Daily Quest: Read 1 Chapter',
        notes: 'Read at least one chapter today to maintain your Cursed Energy output.'
      };

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
      });

      if (!res.ok) throw new Error('Failed to create task');
      showToast({ title: 'Task Added', description: 'Daily quest added to Google Tasks!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Task Creation Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const createFeedbackForm = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm("Create a feedback form for the archive?")) return;

    setLoading('forms');
    try {
      const formBody = {
        info: {
          title: 'The Colony - Book Feedback',
          documentTitle: 'The Colony - Book Feedback Form',
        }
      };

      // Create form
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
      });

      if (!res.ok) throw new Error('Failed to create form');
      
      const formData = await res.json();
      const formId = formData.formId;

      // Add a question to the form
      const updateReq = {
        requests: [
          {
            createItem: {
              item: {
                title: 'How would you rate this tome?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Masterpiece (Special Grade)' },
                        { value: 'Excellent (Grade 1)' },
                        { value: 'Good (Grade 2)' },
                        { value: 'Average (Grade 3)' },
                        { value: 'Poor (Grade 4)' }
                      ]
                    }
                  }
                }
              },
              location: { index: 0 }
            }
          }
        ]
      };

      await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateReq)
      });

      showToast({ title: 'Form Created', description: `Feedback form created! Check your Google Drive.`, type: 'success' });
      
      // Optionally open the form responder URI
      if (formData.responderUri) {
        window.open(formData.responderUri, '_blank');
      }

    } catch (err: any) {
      showToast({ title: 'Form Creation Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const saveToKeep = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm("Save your reading list to Google Keep?")) return;

    setLoading('keep');
    try {
      const note = {
        title: 'Culling Games Reading List',
        body: {
          text: {
            text: 'Here is your current reading list for the Colony tournament...\n- Tome 1\n- Tome 2'
          }
        }
      };

      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(note)
      });

      if (!res.ok) throw new Error('Failed to create note in Google Keep');
      showToast({ title: 'Keep Note Created', description: 'Reading list saved to Google Keep!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Keep Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const createChatSpace = async () => {
    const token = await checkAuth();
    if (!token) return;

    if (!window.confirm("Create a Google Chat space for the Culling Games?")) return;

    setLoading('chat');
    try {
      // 1. Create a space
      const spaceBody = {
        spaceType: "SPACE",
        displayName: "The Colony: Reading Group"
      };

      const spaceRes = await fetch('https://chat.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(spaceBody)
      });

      if (!spaceRes.ok) throw new Error('Failed to create Google Chat space');
      const space = await spaceRes.json();

      // 2. Post a welcome message
      const msgBody = {
        text: "Welcome to The Colony Reading Group! Let the games begin."
      };

      await fetch(`https://chat.googleapis.com/v1/${space.name}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msgBody)
      });

      showToast({ title: 'Chat Space Created', description: 'New space created in Google Chat!', type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Chat Failed', description: err.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10 bg-surface-charcoal/85 backdrop-blur-lg border border-primary/40 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] mb-12">
      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary" />

      <div className="mb-6 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-esports font-black italic uppercase text-primary mb-2 flex items-center gap-3">
          <Zap className="text-primary" size={24} />
          Workspace Tools
        </h2>
        <p className="text-sm font-mono text-on-surface-variant/70 uppercase tracking-widest">
          Enhance your Cursed Archive experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ToolButton 
          icon={<HardDrive />} 
          label="Export Report" 
          description="Save to Google Drive" 
          onClick={exportToDrive} 
          loading={loading === 'drive'} 
        />
        <ToolButton 
          icon={<Mail />} 
          label="Send Newsletter" 
          description="Via Gmail" 
          onClick={sendEmail} 
          loading={loading === 'gmail'} 
        />
        <ToolButton 
          icon={<CalendarIcon />} 
          label="Tournament Reminder" 
          description="Add to Google Calendar" 
          onClick={scheduleReminder} 
          loading={loading === 'calendar'} 
        />
        <ToolButton 
          icon={<CheckSquare />} 
          label="Daily Quest" 
          description="Add to Google Tasks" 
          onClick={addQuest} 
          loading={loading === 'tasks'} 
        />
        <ToolButton 
          icon={<FileText />} 
          label="Feedback Form" 
          description="Create Google Form" 
          onClick={createFeedbackForm} 
          loading={loading === 'forms'} 
        />
        <ToolButton 
          icon={<StickyNote />} 
          label="Reading List" 
          description="Save to Google Keep" 
          onClick={saveToKeep} 
          loading={loading === 'keep'} 
        />
        <ToolButton 
          icon={<MessageSquare />} 
          label="Reading Group" 
          description="Create Google Chat" 
          onClick={createChatSpace} 
          loading={loading === 'chat'} 
        />
      </div>
    </div>
  );
};

const ToolButton = ({ icon, label, description, onClick, loading }: any) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-start p-4 bg-black/40 border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all text-left relative group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between w-full mb-3 text-primary">
        {loading ? <Loader2 className="animate-spin" size={24} /> : icon}
        {!loading && <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      
      <span className="font-esports font-bold tracking-widest uppercase text-sm text-on-surface mb-1">
        {label}
      </span>
      <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider">
        {description}
      </span>
    </motion.button>
  );
};
