import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Frown,
  Heart,
  Laugh,
  Meh,
  Send,
  Smile,
  Users,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../api/hook/useEmployee';
import {
  usePosts,
  useCreatePost,
  useAddComment,
  useToggleLike,
  useAddReaction,
  useMoodDistribution,
  useSubmitMood,
  useSurveys,
  useSubmitSurveyResponse
} from '../api/hook/useEngagement';

export const Engagement: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, showConfirm, showAlert } = useApp();

  // Active employee context (for simulation)
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Fetch employees list
  const { data: dbEmployeesRes, isLoading: employeesLoading } = useEmployees();
  const employeesList = dbEmployeesRes?.data || [];

  // Automatically select first employee as current user
  useEffect(() => {
    if (employeesList.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employeesList[0].id);
    }
  }, [employeesList, selectedEmpId]);

  const activeEmployee = employeesList.find(emp => emp.id === selectedEmpId);

  // Queries
  const { data: postsRes, isLoading: postsLoading } = usePosts(selectedEmpId);
  const postsList = postsRes?.data || [];

  const { data: moodRes, isLoading: moodLoading } = useMoodDistribution();
  const moodDistribution = moodRes?.data || { thrilled: 52, content: 32, neutral: 12, stressed: 4 };

  const { data: surveysRes, isLoading: surveysLoading } = useSurveys(selectedEmpId);
  const surveysList = surveysRes?.data || [];

  // Mutations
  const createPostMut = useCreatePost();
  const addCommentMut = useAddComment();
  const toggleLikeMut = useToggleLike();
  const addReactionMut = useAddReaction();
  const submitMoodMut = useSubmitMood();
  const submitSurveyMut = useSubmitSurveyResponse();

  // Input states
  const [newPostText, setNewPostText] = useState('');
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [selectedSurveyRatings, setSelectedSurveyRatings] = useState<Record<string, number>>({});

  // Helper: compute current week key (e.g. 2026-W28)
  const getWeekKey = () => {
    const d = new Date();
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || !activeEmployee) return;

    showConfirm({
      title: "Share Update",
      message: "Post this company update to the engagement social feed?",
      type: "confirm",
      confirmText: "Post Update",
      onConfirm: () => {
        createPostMut.mutate({
          authorName: activeEmployee.name,
          authorRole: activeEmployee.designation || 'Staff Member',
          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
          content: newPostText,
        }, {
          onSuccess: () => {
            addAuditLog("Posted Announcement", "Engagement Module", `${activeEmployee.name} shared an update on the feed.`);
            setNewPostText('');
            showAlert("Company update posted successfully.", "Update Posted", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to post update", "Error", "danger");
          }
        });
      }
    });
  };

  const handleLikePost = (postId: string) => {
    if (!selectedEmpId) return;
    toggleLikeMut.mutate({ postId, employeeId: selectedEmpId });
  };

  const handleReaction = (postId: string, reactType: string) => {
    if (!selectedEmpId) return;
    addReactionMut.mutate({ postId, employeeId: selectedEmpId, type: reactType });
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentTxt = commentTextMap[postId];
    if (!commentTxt || !commentTxt.trim() || !activeEmployee) return;

    addCommentMut.mutate({
      postId,
      userName: activeEmployee.name,
      text: commentTxt,
    }, {
      onSuccess: () => {
        setCommentTextMap(prev => ({ ...prev, [postId]: '' }));
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to add comment", "Error", "danger");
      }
    });
  };

  const handleMoodSubmit = (moodValue: 'THRILLED' | 'CONTENT' | 'NEUTRAL' | 'STRESSED') => {
    if (!selectedEmpId) return;
    const weekKey = getWeekKey();

    submitMoodMut.mutate({
      employeeId: selectedEmpId,
      mood: moodValue,
      weekKey,
    }, {
      onSuccess: () => {
        addAuditLog("Logged Mood", "Engagement Module", `${activeEmployee?.name} logged mood check-in: ${moodValue}`);
        showAlert(`Thank you! Your mood check-in (${moodValue.toLowerCase()}) was registered anonymously.`, "Mood Logged", "success");
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "You have already logged your check-in for this week.", "Check-in Logged", "info");
      }
    });
  };

  const handleSurveySubmit = (surveyId: string) => {
    if (!selectedEmpId) return;
    const rating = selectedSurveyRatings[surveyId];
    if (rating === undefined) return;

    submitSurveyMut.mutate({
      surveyId,
      employeeId: selectedEmpId,
      rating,
    }, {
      onSuccess: () => {
        addAuditLog("Submitted Survey", "Engagement Module", `${activeEmployee?.name} completed active pulse survey`);
        showAlert("Survey response saved successfully.", "Survey Saved", "success");
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to submit survey", "Error", "danger");
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveSubModule('feed')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'feed' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Announcement Feed
        </button>
        <button 
          onClick={() => setActiveSubModule('mood')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'mood' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Mood Analysis Gauge
        </button>
        <button 
          onClick={() => setActiveSubModule('surveys')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'surveys' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Pulse Surveys
        </button>
      </div>

      {/* Global Simulated User Switcher */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Simulate as Employee</h4>
            <p className="text-slate-450 mt-0.5">Switch employees to simulate reactions, comment authors, weekly mood checks, and survey responses.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
          >
            {employeesLoading ? (
              <option>Loading employees...</option>
            ) : (
              employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} • {(emp.department?.name || (typeof emp.department === 'string' ? emp.department : '') || 'IT')} ({emp.designation || 'Staff'})
                </option>
              ))
            )}
          </select>

          {activeEmployee && (
            <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl font-bold uppercase text-[10px]">
              {activeEmployee.department?.name || 'Operations'}
            </span>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 1. SOCIAL ANNOUNCEMENT FEED             */}
      {/* ======================================= */}
      {activeSubModule === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Create announcement & suggestions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Publish HR Update</span>
            </h3>
            
            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <textarea 
                value={newPostText} 
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What is happening in the company? Share team updates..." 
                rows={4} 
                required 
                className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
              />
              <button 
                type="submit" 
                disabled={createPostMut.isPending}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
              >
                {createPostMut.isPending ? "Posting..." : "Post Update"}
              </button>
            </form>
          </div>

          {/* Social feed posts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">FactoCorp Communication Wall</h3>
            
            {postsLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium animate-pulse">Loading communication feed...</div>
            ) : postsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">No updates posted yet. Be the first to share!</div>
            ) : (
              <div className="space-y-6">
                {postsList.map((post) => (
                  <div key={post.id} className="p-4 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-4 bg-slate-50 dark:bg-slate-950/40">
                    <div className="flex gap-3">
                      <img src={post.authorAvatar} alt={post.author} className="h-10 w-10 rounded-full object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white leading-none">{post.author}</p>
                        <span className="text-[9px] text-slate-450 font-semibold">{post.authorRole} • {post.date}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {post.image && (
                      <img src={post.image} alt="Announcement attachment" className="w-full h-48 object-cover rounded-xl border border-slate-100 dark:border-slate-850" />
                    )}

                    {/* Likes/reactions section */}
                    <div className="flex items-center gap-4 border-y border-slate-200/50 dark:border-slate-800 py-2 text-slate-450">
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 font-bold transition-colors ${
                          post.likedByMe ? 'text-rose-500' : 'hover:text-slate-700 dark:hover:text-slate-350'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-rose-500' : ''}`} />
                        <span>{post.likes} Likes</span>
                      </button>
                      
                      <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-full">
                        {post.reactions.map((r, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleReaction(post.id, r.type)}
                            className="hover:scale-115 transition-transform font-medium"
                            title="React"
                          >
                            {r.type} <span className="text-[9px] text-slate-400 font-bold">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment Section */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 text-[11px]">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-850 dark:text-white">{comment.user}</span>
                              <span className="text-[9px] text-slate-450">{comment.date}</span>
                            </div>
                            <p className="text-slate-650 dark:text-slate-400 mt-1">{comment.text}</p>
                          </div>
                        ))}
                      </div>

                      <form 
                        onSubmit={(e) => handleAddComment(post.id, e)} 
                        className="flex gap-2 items-center"
                      >
                        <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={commentTextMap[post.id] || ''}
                          onChange={(e) => setCommentTextMap({ ...commentTextMap, [post.id]: e.target.value })}
                          className="flex-1 px-3 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                        />
                        <button 
                          type="submit" 
                          disabled={!(commentTextMap[post.id] || '').trim() || addCommentMut.isPending}
                          className="p-1.5 bg-primary text-white rounded-lg hover:scale-105 transition-all disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. MOOD ANALYSIS                        */}
      {/* ======================================= */}
      {activeSubModule === 'mood' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Submit Mood checkin */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Weekly Mood Check-In</h3>
            <p className="text-slate-400">How are you feeling this week? Your response is entirely confidential.</p>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={() => handleMoodSubmit('THRILLED')}
                disabled={submitMoodMut.isPending}
                className="p-4 border rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-950 dark:hover:bg-emerald-950/20 text-center font-bold text-slate-750 hover:text-emerald-500 border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all space-y-1"
              >
                <Laugh className="h-7 w-7 text-emerald-500 mx-auto" />
                <span className="block text-[11px] mt-1">Thrilled</span>
              </button>

              <button
                onClick={() => handleMoodSubmit('CONTENT')}
                disabled={submitMoodMut.isPending}
                className="p-4 border rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-blue-950/20 text-center font-bold text-slate-750 hover:text-blue-500 border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all space-y-1"
              >
                <Smile className="h-7 w-7 text-blue-500 mx-auto" />
                <span className="block text-[11px] mt-1">Content</span>
              </button>

              <button
                onClick={() => handleMoodSubmit('NEUTRAL')}
                disabled={submitMoodMut.isPending}
                className="p-4 border rounded-xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-950 dark:hover:bg-amber-950/20 text-center font-bold text-slate-750 hover:text-amber-500 border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/60 transition-all space-y-1"
              >
                <Meh className="h-7 w-7 text-amber-500 mx-auto" />
                <span className="block text-[11px] mt-1">Neutral</span>
              </button>

              <button
                onClick={() => handleMoodSubmit('STRESSED')}
                disabled={submitMoodMut.isPending}
                className="p-4 border rounded-xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/20 text-center font-bold text-slate-750 hover:text-rose-500 border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 transition-all space-y-1"
              >
                <Frown className="h-7 w-7 text-rose-500 mx-auto" />
                <span className="block text-[11px] mt-1">Stressed</span>
              </button>
            </div>
          </div>

          {/* Mood chart metrics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">FactoCorp Aggregated Mood Pulse</h3>
            
            {moodLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium">Loading mood logs...</div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Laugh className="h-4 w-4 text-emerald-500" /> Thrilled</span>
                    <span>{moodDistribution.thrilled}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${moodDistribution.thrilled}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Smile className="h-4 w-4 text-blue-500" /> Content</span>
                    <span>{moodDistribution.content}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${moodDistribution.content}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Meh className="h-4 w-4 text-amber-500" /> Neutral</span>
                    <span>{moodDistribution.neutral}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${moodDistribution.neutral}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Frown className="h-4 w-4 text-rose-500" /> Stressed</span>
                    <span>{moodDistribution.stressed}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${moodDistribution.stressed}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. SURVEYS & FEEDBACK                   */}
      {/* ======================================= */}
      {activeSubModule === 'surveys' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Active Corporate Surveys</h3>
            <p className="text-slate-450 mt-1">Provide feedback anonymously to shape corporate policy revisions.</p>
          </div>

          {surveysLoading ? (
            <div className="py-8 text-center text-slate-400 font-medium">Loading survey listings...</div>
          ) : surveysList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">No surveys are active right now.</div>
          ) : (
            <div className="space-y-6">
              {surveysList.map((s) => {
                const currentRating = selectedSurveyRatings[s.id] || 0;
                return (
                  <div key={s.id} className="border border-slate-200/50 dark:border-slate-800 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-2.5">
                      <div>
                        <span className="font-bold text-slate-850 dark:text-white text-sm">{s.title}</span>
                        <span className="text-[10px] text-slate-450 block mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Closes on: {new Date(s.closesAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {s.status}
                      </span>
                    </div>

                    {s.responded ? (
                      <div className="text-center py-4 space-y-2">
                        <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-slate-850 dark:text-white">Thank you for submitting your survey!</p>
                        <p className="text-slate-450 text-[10px]">Your feedback was anonymized and recorded successfully.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="font-bold text-slate-700 dark:text-slate-350">{s.question}</p>
                        
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setSelectedSurveyRatings({
                                ...selectedSurveyRatings,
                                [s.id]: rating
                              })}
                              className={`h-9 w-9 rounded-lg font-bold border transition-colors ${
                                currentRating === rating 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex justify-between text-[9px] text-slate-400 max-w-xs font-bold uppercase">
                          <span>Very Unsatisfied</span>
                          <span>Extremely Pleased</span>
                        </div>

                        <button
                          disabled={currentRating === 0 || submitSurveyMut.isPending}
                          onClick={() => handleSurveySubmit(s.id)}
                          className="px-4 py-1.5 bg-primary text-white rounded-lg font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                        >
                          {submitSurveyMut.isPending ? "Submitting..." : "Submit Survey Feedback"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
