import React, { useState } from 'react';
import { AlertCircle, Send, FileText, Trash2, CheckCircle, Clock, X } from 'lucide-react';
import { Complaint } from '../types';

interface ComplaintLaunchProps {
  isAdmin: boolean;
  userEmail: string;
  complaints: Complaint[];
  onSubmitComplaint: (complaint: {
    subject: string;
    details: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    department: 'security' | 'medical' | 'facilities' | 'crowd-management' | 'general';
  }) => void;
  onRevokeComplaint: (complaintId: string) => void;
  onReplyToComplaint: (complaintId: string, reply: string) => void;
  onUpdateStatus: (complaintId: string, status: 'open' | 'in-progress' | 'resolved') => void;
}

const ComplaintLaunch: React.FC<ComplaintLaunchProps> = ({
  isAdmin,
  userEmail,
  complaints,
  onSubmitComplaint,
  onRevokeComplaint,
  onReplyToComplaint,
  onUpdateStatus
}) => {
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [department, setDepartment] = useState<'security' | 'medical' | 'facilities' | 'crowd-management' | 'general'>('general');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmitComplaint({
      subject,
      details,
      importance,
      department
    });

    // Reset form
    setSubject('');
    setDetails('');
    setImportance('medium');
    setDepartment('general');
  };

  const handleReplySubmit = (complaintId: string) => {
    const reply = replyText[complaintId];
    if (!reply || !reply.trim()) {
      alert('Please enter a reply');
      return;
    }

    onReplyToComplaint(complaintId, reply);
    setReplyText({ ...replyText, [complaintId]: '' });
    setShowReplyForm(null);
  };

  const getImportanceColor = (imp: string) => {
    switch (imp) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'in-progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'revoked': return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
      case 'open': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  // Show all complaints to both public and admin users
  // This ensures transparency and allows everyone to see all complaints and admin responses
  const displayComplaints = complaints;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {isAdmin ? 'Complaint Management' : 'Complaint Launch'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin 
              ? 'View and respond to user complaints' 
              : 'Submit complaints about the event or services'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <AlertCircle size={16} className="text-blue-400" />
            <span className="text-sm font-bold text-blue-400">
              {complaints.filter(c => c.status === 'open').length} Open
            </span>
          </div>
        )}
      </div>

      {/* Complaint Submission Form (Non-Admin Only) */}
      {!isAdmin && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <FileText size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Submit New Complaint</h3>
              <p className="text-xs text-slate-400">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your complaint"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide detailed information about your complaint"
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                required
              />
            </div>

            {/* Importance & Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Importance
                </label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="general">General</option>
                  <option value="security">Security</option>
                  <option value="medical">Medical</option>
                  <option value="facilities">Facilities</option>
                  <option value="crowd-management">Crowd Management</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Submit Complaint
            </button>
          </form>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">
          {isAdmin ? 'All Complaints' : 'Your Complaints'}
        </h3>

        {displayComplaints.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">
              {isAdmin ? 'No complaints submitted yet' : 'You haven\'t submitted any complaints'}
            </p>
          </div>
        ) : (
          displayComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">{complaint.subject}</h4>
                  <p className="text-sm text-slate-400 mb-3">{complaint.details}</p>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getImportanceColor(complaint.importance)}`}>
                      {complaint.importance.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
                      {complaint.status.toUpperCase().replace('-', ' ')}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold border text-slate-400 bg-slate-800/50 border-slate-700">
                      {complaint.department.toUpperCase().replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!isAdmin && complaint.status !== 'revoked' && complaint.status !== 'resolved' && (
                  <button
                    onClick={() => onRevokeComplaint(complaint.id)}
                    className="ml-4 p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                    title="Revoke complaint"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Submitted: {complaint.submittedAt}</span>
                {isAdmin && <span>By: {complaint.submittedBy}</span>}
              </div>

              {/* Admin Reply Section */}
              {complaint.adminReply && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <CheckCircle size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-400 mb-1">Admin Response</p>
                      <p className="text-sm text-slate-300">{complaint.adminReply}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>By: {complaint.repliedBy}</span>
                        <span>•</span>
                        <span>{complaint.repliedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Controls */}
              {isAdmin && complaint.status !== 'revoked' && (
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  {/* Status Update Buttons */}
                  <div className="flex gap-2">
                    {complaint.status === 'open' && (
                      <button
                        onClick={() => onUpdateStatus(complaint.id, 'in-progress')}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                      >
                        <Clock size={14} />
                        Mark In Progress
                      </button>
                    )}
                    {(complaint.status === 'open' || complaint.status === 'in-progress') && (
                      <button
                        onClick={() => onUpdateStatus(complaint.id, 'resolved')}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  {/* Reply Button */}
                  {!complaint.adminReply && (
                    <button
                      onClick={() => setShowReplyForm(showReplyForm === complaint.id ? null : complaint.id)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}

              {/* Reply Form (Admin Only) */}
              {isAdmin && showReplyForm === complaint.id && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-bold text-slate-300">Admin Response</label>
                  <textarea
                    value={replyText[complaint.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [complaint.id]: e.target.value })}
                    placeholder="Type your response here..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReplySubmit(complaint.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      Send Reply
                    </button>
                    <button
                      onClick={() => setShowReplyForm(null)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComplaintLaunch;
