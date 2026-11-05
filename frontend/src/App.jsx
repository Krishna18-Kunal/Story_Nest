import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const DEFAULT_AUTHOR = 'Krishna Kunal';
const REVIEWS_KEY = 'blog-data-hub-reviews';
const CLIENT_KEY = 'blog-data-hub-client-id';
const SAVED_KEY = 'blog-data-hub-saved';
const THEME_KEY = 'blog-data-hub-theme';
const DRAFT_KEY = 'blog-data-hub-draft';
const QA_KEY = 'blog-data-hub-questions';

/* ---------- Storage helpers (browser localStorage) ---------- */

function loadReviews() {
  try {
    const saved = localStorage.getItem(REVIEWS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function loadJSON(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

// Unique ID for this browser - used to know who owns a review / question
function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return 'user-temp';
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getStats(list = []) {
  const count = list.length;
  const avg = count
    ? list.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;
  return { count, avg };
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';
}

function readingTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/* ---------- Icons (SVG) ---------- */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
};

function MoonIcon({ size = 20 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SunIcon({ size = 20 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function BookmarkIcon({ filled = false, size = 18 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <path
        d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

function ClockIcon({ size = 16 }) {
  return (
    <svg {...iconProps} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/* ---------- Star components ---------- */

function Stars({ value = 0 }) {
  const rounded = Math.round(value);
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= rounded ? 'star on' : 'star'}>★</span>
      ))}
    </span>
  );
}

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={n <= shown ? 'star-btn on' : 'star-btn'}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
      <span className="star-label">
        {['Select rating', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][shown]}
      </span>
    </div>
  );
}

/* ---------- Hero artwork ---------- */

function CreativeArtwork() {
  return (
    <div className="creative-artwork">
      <div className="orbit orbit-one"></div>
      <div className="orbit orbit-two"></div>

      <div className="paper-plane">
        <span>➤</span>
        <div className="plane-trail"></div>
      </div>

      <div className="story-card card-life">
        <span className="card-tag">LIFE</span>
        <h3>A Little Happiness...</h3>
        <div className="flower-art">✿</div>
        <div className="card-lines"></div>
      </div>

      <div className="story-card card-main">
        <span className="card-tag">FEATURED STORY</span>
        <h2>Dream Bigger,<br />Write Better.</h2>
        <div className="mountain-art">
          <span>✦</span>
          <span>⛰</span>
          <span>✧</span>
        </div>
        <div className="card-lines"></div>
        <div className="card-lines short-line"></div>
      </div>

      <div className="story-card card-tech">
        <span className="card-tag">TECH</span>
        <h3>Build. Explore.<br />Innovate.</h3>
        <div className="tech-art"><span>⌘</span></div>
      </div>

      <div className="floating-book">
        <span>✧</span>
        <div>▣</div>
      </div>

      <div className="open-book">
        <div className="book-page left-page">
          <div className="page-line"></div>
          <div className="page-line"></div>
          <div className="page-line small"></div>
        </div>
        <div className="book-page right-page">
          <div className="page-line"></div>
          <div className="page-line"></div>
          <div className="page-line small"></div>
        </div>
        <div className="book-spine"></div>
        <div className="book-bottom"></div>
      </div>

      <div className="floating-pen">✒</div>
      <div className="sparkle sparkle-one">✦</div>
      <div className="sparkle sparkle-two">✧</div>
      <div className="sparkle sparkle-three">✦</div>

      <div className="art-caption">
        <span>01 /</span> EVERY STORY MATTERS
      </div>
    </div>
  );
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // Theme, bookmarks, sort, progress, back-to-top
  const [theme, setTheme] = useState(() => loadJSON(THEME_KEY, 'light'));
  const [saved, setSaved] = useState(() => loadJSON(SAVED_KEY, []));
  const [sort, setSort] = useState('newest');
  const [onlySaved, setOnlySaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  // Reviews + popup
  const [clientId] = useState(getClientId);
  const [reviews, setReviews] = useState(loadReviews);
  const [activePostId, setActivePostId] = useState(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  // Three-dot menu + review edit (only the comment can be edited)
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editReviewId, setEditReviewId] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editError, setEditError] = useState('');

  // Q&A
  const [tab, setTab] = useState('reviews');
  const [questions, setQuestions] = useState(() => loadJSON(QA_KEY, {}));
  const [qName, setQName] = useState('');
  const [qText, setQText] = useState('');
  const [qMsg, setQMsg] = useState({ type: '', text: '' });
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [aName, setAName] = useState('');
  const [aText, setAText] = useState('');
  const [aError, setAError] = useState('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/posts`);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setPosts(Array.isArray(result.data) ? result.data : []);
    } catch (e) {
      setError(`${e.message}. Check backend connection and VITE_API_URL.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Save reviews whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    } catch {
      /* storage full or blocked - ignore */
    }
  }, [reviews]);

  // Save questions whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(QA_KEY, JSON.stringify(questions));
    } catch {
      /* ignore */
    }
  }, [questions]);

  // Theme (dark / light)
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Save bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [saved]);

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Draft autosave (only while writing a new blog)
  useEffect(() => {
    if (!showForm || editingId || (!title && !content)) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, author }));
    } catch {
      /* ignore */
    }
  }, [showForm, editingId, title, content, author]);

  const activePost = posts.find(p => p._id === activePostId) || null;

  // Esc to close + lock page scroll while popup is open
  useEffect(() => {
    if (!activePost) return undefined;

    const onKey = e => {
      if (e.key === 'Escape') {
        setMenuOpenId(null);
        setActivePostId(null);
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [activePost]);

  // Close the three-dot menu when clicking anywhere outside it
  useEffect(() => {
    if (!menuOpenId) return undefined;

    const onClick = e => {
      if (!e.target.closest('.review-menu')) setMenuOpenId(null);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [menuOpenId]);

  // Search filter + saved filter + sorting
  const query = search.trim().toLowerCase();
  const filteredPosts = posts
    .filter(
      post =>
        `${post.title || ''} ${post.content || ''} ${post.author || ''}`
          .toLowerCase()
          .includes(query) &&
        (!onlySaved || saved.includes(post._id))
    )
    .sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sort === 'top') {
        return getStats(reviews[b._id]).avg - getStats(reviews[a._id]).avg;
      }
      if (sort === 'most') {
        return getStats(reviews[b._id]).count - getStats(reviews[a._id]).count;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  function toggleSave(id) {
    setSaved(old =>
      old.includes(id) ? old.filter(x => x !== id) : [...old, id]
    );
  }

  function scrollToBlogs() {
    document.getElementById('latest-blogs')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function openBlogForm() {
    setShowForm(true);
    setError('');
    setNotice('');

    // Restore unsaved draft (if any)
    if (!title && !content) {
      const d = loadJSON(DRAFT_KEY, null);
      if (d) {
        setTitle(d.title || '');
        setContent(d.content || '');
        setAuthor(d.author || DEFAULT_AUTHOR);
      }
    }

    setTimeout(() => {
      document.getElementById('create-blog')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  function clearForm() {
    setTitle('');
    setContent('');
    setAuthor(DEFAULT_AUTHOR);
    setImage(null);
    setEditingId(null);

    const input = document.getElementById('post-image');
    if (input) input.value = '';
  }

  async function submit(event) {
    event.preventDefault();

    setError('');
    setNotice('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    if (image && image.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.');
      return;
    }

    const form = new FormData();

    form.append('title', title.trim());
    form.append('content', content.trim());
    form.append('author', author.trim() || DEFAULT_AUTHOR);

    if (image) form.append('image', image);

    setSaving(true);

    try {
      const response = await fetch(
        editingId ? `${API}/posts/${editingId}` : `${API}/posts`,
        {
          method: editingId ? 'PUT' : 'POST',
          body: form
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setNotice(
        editingId
          ? 'Post updated successfully!'
          : 'Your blog has been published successfully!'
      );

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }

      clearForm();
      setShowForm(false);
      await loadPosts();

      setTimeout(scrollToBlogs, 150);
    } catch (e) {
      setError(e.message || 'Unable to save post.');
    } finally {
      setSaving(false);
    }
  }

  function edit(post) {
    setEditingId(post._id);
    setTitle(post.title || '');
    setContent(post.content || '');
    setAuthor(post.author || DEFAULT_AUTHOR);
    setImage(null);

    setError('');
    setNotice('');
    setShowForm(true);

    setTimeout(() => {
      document.getElementById('create-blog')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  async function remove(id) {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API}/posts/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setPosts(old => old.filter(post => post._id !== id));
      setSaved(old => old.filter(x => x !== id));
      setNotice('Blog deleted successfully!');
    } catch (e) {
      setError(e.message || 'Unable to delete post.');
    }
  }

  /* ---------- Popup + review handlers ---------- */

  function cancelEditReview() {
    setEditReviewId(null);
    setEditComment('');
    setEditError('');
  }

  function openPost(id) {
    setActivePostId(id);
    setReviewName('');
    setReviewRating(0);
    setReviewComment('');
    setReviewMsg({ type: '', text: '' });
    setMenuOpenId(null);
    setProgress(0);
    setTab('reviews');
    setQName('');
    setQText('');
    setQMsg({ type: '', text: '' });
    setReplyOpenId(null);
    setAName('');
    setAText('');
    setAError('');
    cancelEditReview();
  }

  function closePost() {
    setActivePostId(null);
    setMenuOpenId(null);
    cancelEditReview();
  }

  // Only the browser that wrote the review can edit/delete it.
  // Old reviews without an owner were created in this browser, so they count as owned.
  function isOwner(review) {
    return !review.ownerId || review.ownerId === clientId;
  }

  function submitReview(event) {
    event.preventDefault();

    if (!reviewName.trim()) {
      setReviewMsg({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    if (!reviewRating) {
      setReviewMsg({ type: 'error', text: 'Please select a star rating.' });
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMsg({ type: 'error', text: 'Please write a short comment.' });
      return;
    }

    const newReview = {
      id: makeId(),
      ownerId: clientId,
      name: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
      editedAt: null
    };

    setReviews(old => ({
      ...old,
      [activePostId]: [newReview, ...(old[activePostId] || [])]
    }));

    setReviewName('');
    setReviewRating(0);
    setReviewComment('');
    setReviewMsg({
      type: 'success',
      text: 'Thank you! Your review has been added.'
    });
  }

  function toggleMenu(id) {
    setMenuOpenId(current => (current === id ? null : id));
  }

  function startEditReview(review) {
    if (!isOwner(review)) return;

    setMenuOpenId(null);
    setEditReviewId(review.id);
    setEditComment(review.comment);
    setEditError('');
  }

  // Only the comment text is updated - name and rating stay the same
  function saveEditReview(event) {
    event.preventDefault();

    if (!editComment.trim()) {
      setEditError('Comment cannot be empty.');
      return;
    }

    setReviews(old => ({
      ...old,
      [activePostId]: (old[activePostId] || []).map(r =>
        r.id === editReviewId && isOwner(r)
          ? {
              ...r,
              ownerId: clientId,
              comment: editComment.trim(),
              editedAt: new Date().toISOString()
            }
          : r
      )
    }));

    cancelEditReview();
  }

  function deleteReview(review) {
    setMenuOpenId(null);

    if (!isOwner(review)) return;
    if (!window.confirm('Delete your review? This cannot be undone.')) return;

    setReviews(old => ({
      ...old,
      [activePostId]: (old[activePostId] || []).filter(r => r.id !== review.id)
    }));

    if (editReviewId === review.id) cancelEditReview();
  }

  /* ---------- Q&A handlers ---------- */

  function submitQuestion(event) {
    event.preventDefault();

    if (!qName.trim()) {
      setQMsg({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    if (!qText.trim()) {
      setQMsg({ type: 'error', text: 'Please write your question.' });
      return;
    }

    const newQuestion = {
      id: makeId(),
      ownerId: clientId,
      name: qName.trim(),
      text: qText.trim(),
      createdAt: new Date().toISOString(),
      answers: []
    };

    setQuestions(old => ({
      ...old,
      [activePostId]: [newQuestion, ...(old[activePostId] || [])]
    }));

    setQText('');
    setQMsg({ type: 'success', text: 'Your question has been posted.' });
  }

  function openReply(id) {
    setReplyOpenId(current => (current === id ? null : id));
    setAText('');
    setAError('');
  }

  function submitAnswer(event, questionId) {
    event.preventDefault();

    if (!aName.trim()) {
      setAError('Please enter your name.');
      return;
    }

    if (!aText.trim()) {
      setAError('Please write your answer.');
      return;
    }

    const newAnswer = {
      id: makeId(),
      ownerId: clientId,
      name: aName.trim(),
      text: aText.trim(),
      createdAt: new Date().toISOString()
    };

    setQuestions(old => ({
      ...old,
      [activePostId]: (old[activePostId] || []).map(q =>
        q.id === questionId
          ? { ...q, answers: [...(q.answers || []), newAnswer] }
          : q
      )
    }));

    setAText('');
    setAError('');
    setReplyOpenId(null);
  }

  function deleteQuestion(question) {
    if (question.ownerId !== clientId) return;
    if (!window.confirm('Delete your question and all its answers?')) return;

    setQuestions(old => ({
      ...old,
      [activePostId]: (old[activePostId] || []).filter(q => q.id !== question.id)
    }));
  }

  function deleteAnswer(questionId, answer) {
    if (answer.ownerId !== clientId) return;
    if (!window.confirm('Delete your answer?')) return;

    setQuestions(old => ({
      ...old,
      [activePostId]: (old[activePostId] || []).map(q =>
        q.id === questionId
          ? { ...q, answers: (q.answers || []).filter(a => a.id !== answer.id) }
          : q
      )
    }));
  }

  const activeReviews = activePost ? reviews[activePost._id] || [] : [];
  const activeStats = getStats(activeReviews);
  const activeQuestions = activePost ? questions[activePost._id] || [] : [];

  return (
    <div className="page">

      {/* NAVBAR */}
      <nav className="navbar">
        <a
          href="#home"
          className="nav-logo"
          onClick={() => setShowForm(false)}
        >
          The Story <span>Nest.</span>
        </a>

        <div className="nav-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search blogs..."
            aria-label="Search blogs"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              scrollToBlogs();
            }}
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="nav-links">
          <a href="#home" onClick={() => setShowForm(false)}>Home</a>
          <a href="#latest-blogs">Explore</a>

          <button
            type="button"
            className="theme-btn"
            aria-label="Toggle dark mode"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            className="nav-write-btn"
            type="button"
            onClick={openBlogForm}
          >
            ✎ Write a Blog
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="home">
        <div className="hero-content">
          <h1>
            Beyond <span>Blog Hub.</span>
          </h1>

          <h2 className="hero-tagline">
            Ideas. Stories. <span>Perspectives.</span>
          </h2>

          <p className="hero-description">
            A creative space where thoughts turn into stories
            and ideas find their audience.
          </p>

          <div className="hero-stats">
            <span>✦ Uncommon Ideas</span>
            <span>✦ Original Perspectives</span>
          </div>

          <button
            className="btn primary hero-write-btn"
            type="button"
            onClick={openBlogForm}
          >
            Start Writing →
          </button>
        </div>

        <CreativeArtwork />
      </header>

      {/* ALERTS */}
      {error && (
        <div className="alert error" role="alert">
          ⚠ {error}
        </div>
      )}

      {notice && (
        <div className="alert success" role="status">
          ✓ {notice}
        </div>
      )}

      {/* LATEST BLOGS */}
      <section className="posts" id="latest-blogs">
        <div className="section-head posts-heading">
          <div>
            <p className="eyebrow">EXPLORE THE COLLECTION</p>

            <h2>
              Latest Blogs
              <span className="count">{filteredPosts.length}</span>
            </h2>

            <p className="section-subtitle">
              Discover stories and ideas from our community.
            </p>
          </div>

          <button
            className="btn light"
            type="button"
            onClick={loadPosts}
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {/* TOOLBAR: sort + saved filter */}
        <div className="toolbar">
          <div className="select-wrap">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label="Sort blogs"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="top">Top rated</option>
              <option value="most">Most reviewed</option>
            </select>
          </div>

          <button
            type="button"
            className={onlySaved ? 'chip on' : 'chip'}
            onClick={() => setOnlySaved(v => !v)}
          >
            <BookmarkIcon filled={onlySaved} size={16} />
            Saved ({saved.length})
          </button>
        </div>

        {loading ? (
          <div className="empty">
            <div className="spinner"></div>
            <p>Loading amazing stories...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✦</div>
            <h3>No Blogs Published Yet</h3>
            <p>Be the first to share your story with the community.</p>

            <button
              className="btn primary empty-btn"
              type="button"
              onClick={openBlogForm}
            >
              Write the First Blog →
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <h3>No blogs found</h3>
            <p>
              {onlySaved && !query
                ? 'You have not saved any blogs yet.'
                : `No blog matches "${search}". Try a different word.`}
            </p>

            <button
              className="btn light empty-btn"
              type="button"
              onClick={() => {
                setSearch('');
                setOnlySaved(false);
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid">
            {filteredPosts.map(post => {
              const stats = getStats(reviews[post._id]);
              const isSaved = saved.includes(post._id);

              return (
                <article className="card" key={post._id}>
                  {post.imageUrl ? (
                    <img
                      className="thumb"
                      src={post.imageUrl}
                      alt={post.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="thumb placeholder">
                      <span>✦</span>
                      <small>BLOG DATA HUB</small>
                    </div>
                  )}

                  <div className="card-body">
                    <div className="card-meta">
                      <span>✦ ARTICLE</span>
                      <small>
                        {post.createdAt ? formatDate(post.createdAt) : 'New Post'}
                        {' · '}
                        {readingTime(post.content)} min read
                      </small>
                    </div>

                    <div className="title-row">
                      <h3>{post.title}</h3>
                      <button
                        type="button"
                        className={isSaved ? 'bookmark on' : 'bookmark'}
                        aria-label={isSaved ? 'Remove from saved' : 'Save blog'}
                        title={isSaved ? 'Remove from saved' : 'Save blog'}
                        onClick={() => toggleSave(post._id)}
                      >
                        <BookmarkIcon filled={isSaved} />
                      </button>
                    </div>

                    <div className="card-rating">
                      <Stars value={stats.avg} />
                      {stats.count > 0 ? (
                        <>
                          <strong>{stats.avg.toFixed(1)}</strong>
                          <span className="rating-count">
                            ({stats.count} {stats.count === 1 ? 'review' : 'reviews'})
                          </span>
                        </>
                      ) : (
                        <span className="rating-count">No reviews yet</span>
                      )}
                      <span className="comment-pill" title="Comments">
                        💬 {stats.count}
                      </span>
                    </div>

                    <p className="content">{post.content}</p>

                    <button
                      type="button"
                      className="read-more"
                      onClick={() => openPost(post._id)}
                    >
                      Read More →
                    </button>

                    <div className="author">
                      <div className="author-avatar">
                        {(post.author || DEFAULT_AUTHOR)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <small>Written by</small>
                        <strong>{post.author || DEFAULT_AUTHOR}</strong>
                      </div>
                    </div>

                    <div className="actions">
                      <button
                        className="btn light"
                        type="button"
                        onClick={() => edit(post)}
                      >
                        ✎ Edit
                      </button>

                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => remove(post._id)}
                      >
                        ✕ Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE BLOG FORM - LAST SECTION, HIDDEN UNTIL OPENED */}
      {showForm && (
        <section className="panel" id="create-blog">
          <div className="section-head">
            <div>
              <p className="eyebrow">CREATE SOMETHING AMAZING</p>

              <h2>
                {editingId ? 'Edit Your Blog' : 'Create a New Blog'}
              </h2>

              <p className="section-subtitle">
                Share your thoughts, knowledge and experiences.
              </p>
            </div>

            <button
              className="btn light"
              type="button"
              onClick={() => {
                if (editingId) clearForm();
                setShowForm(false);
              }}
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={submit} className="form">
            <div className="field">
              <label htmlFor="post-title">Blog Title *</label>
              <input
                id="post-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={160}
                required
                placeholder="Enter an attractive blog title..."
              />
            </div>

            <div className="field">
              <label htmlFor="post-author">Author Name</label>
              <input
                id="post-author"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="field full">
              <label htmlFor="post-content">Blog Content *</label>
              <textarea
                id="post-content"
                rows="6"
                value={content}
                onChange={e => setContent(e.target.value)}
                required
                placeholder="Write your amazing blog here..."
              />
              <small>
                {content.trim().split(/\s+/).filter(Boolean).length} words ·{' '}
                {readingTime(content)} min read
                {!editingId && ' · Draft auto-saved'}
              </small>
            </div>

            <div className="field full">
              <label htmlFor="post-image">Cover Image (Optional)</label>
              <input
                id="post-image"
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
              />
              <small>
                Maximum image size: 5 MB. Cloudinary configuration
                is required for image uploads.
              </small>
            </div>

            <div className="form-foot full">
              <span>* Required fields</span>

              <button
                className="btn primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Publishing...'
                  : editingId
                    ? 'Save Changes →'
                    : 'Publish Blog →'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* BACK TO TOP */}
      {showTop && (
        <button
          type="button"
          className="to-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      )}

      {/* FOOTER */}
      <footer>
        <div>
          © {new Date().getFullYear()} <strong>Krishna Kunal</strong>
        </div>

        <div>Your Space · Your Stories · Your Voice</div>
      </footer>

      {/* ========== BLOG POPUP (Read More) ========== */}
      {activePost && (
        <div className="modal-overlay" onClick={closePost}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={activePost.title}
            onClick={e => e.stopPropagation()}
            onScroll={e => {
              const el = e.currentTarget;
              const max = el.scrollHeight - el.clientHeight;
              setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
            }}
          >
            <div className="read-progress" style={{ width: `${progress}%` }} />

            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={closePost}
            >
              ✕
            </button>

            {activePost.imageUrl ? (
              <img
                className="modal-cover"
                src={activePost.imageUrl}
                alt={activePost.title}
              />
            ) : (
              <div className="modal-cover modal-cover-placeholder">✦</div>
            )}

            <div className="modal-body">
              <div className="card-meta">
                <span>✦ ARTICLE</span>
                <small>{formatDate(activePost.createdAt)}</small>
              </div>

              <h2 className="modal-title">{activePost.title}</h2>

              <div className="modal-tools">
                <span className="read-time">
                  <ClockIcon /> {readingTime(activePost.content)} min read
                </span>

                <button
                  type="button"
                  className={
                    saved.includes(activePost._id)
                      ? 'btn light tool-btn is-saved'
                      : 'btn light tool-btn'
                  }
                  onClick={() => toggleSave(activePost._id)}
                >
                  <BookmarkIcon
                    filled={saved.includes(activePost._id)}
                    size={16}
                  />
                  {saved.includes(activePost._id) ? 'Saved' : 'Save'}
                </button>
              </div>

              <div className="modal-author">
                <div className="author-avatar">
                  {(activePost.author || DEFAULT_AUTHOR).charAt(0).toUpperCase()}
                </div>
                <div>
                  <small>Written by</small>
                  <strong>{activePost.author || DEFAULT_AUTHOR}</strong>
                </div>

                <div className="modal-quick-rating">
                  <Stars value={activeStats.avg} />
                  <span>
                    {activeStats.count > 0
                      ? `${activeStats.avg.toFixed(1)} · ${activeStats.count} ${
                          activeStats.count === 1 ? 'review' : 'reviews'
                        }`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>

              <p className="modal-content">{activePost.content}</p>

              {/* TABS: Reviews | Q&A */}
              <div className="tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'reviews'}
                  className={tab === 'reviews' ? 'tab on' : 'tab'}
                  onClick={() => setTab('reviews')}
                >
                  ★ Reviews
                  <span className="tab-count">{activeStats.count}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'qa'}
                  className={tab === 'qa' ? 'tab on' : 'tab'}
                  onClick={() => setTab('qa')}
                >
                  ? Questions
                  <span className="tab-count">{activeQuestions.length}</span>
                </button>
              </div>

              {/* ========== REVIEWS TAB ========== */}
              {tab === 'reviews' && (
                <section className="reviews">
                  {/* REVIEW FORM */}
                  <form className="review-form" onSubmit={submitReview}>
                    <h4>Write a review</h4>

                    <StarInput value={reviewRating} onChange={setReviewRating} />

                    <input
                      type="text"
                      placeholder="Your name *"
                      value={reviewName}
                      maxLength={40}
                      required
                      onChange={e => setReviewName(e.target.value)}
                    />

                    <textarea
                      rows="3"
                      placeholder="Share your thoughts about this blog..."
                      value={reviewComment}
                      maxLength={500}
                      onChange={e => setReviewComment(e.target.value)}
                    />

                    {reviewMsg.text && (
                      <div className={`alert ${reviewMsg.type} review-msg`}>
                        {reviewMsg.type === 'success' ? '✓ ' : '⚠ '}
                        {reviewMsg.text}
                      </div>
                    )}

                    <div className="review-foot">
                      <small>{reviewComment.length}/500</small>
                      <button type="submit" className="btn primary">
                        Submit Review →
                      </button>
                    </div>
                  </form>

                  {/* REVIEW LIST - owner gets a three-dot menu */}
                  <div className="review-list">
                    {activeReviews.length === 0 ? (
                      <p className="no-reviews">
                        No reviews yet. Be the first to review this blog!
                      </p>
                    ) : (
                      activeReviews.map(r => {
                        const mine = isOwner(r);

                        // EDIT MODE - only the comment can be changed
                        if (editReviewId === r.id) {
                          return (
                            <form
                              className="review-item review-editing"
                              key={r.id}
                              onSubmit={saveEditReview}
                            >
                              <div className="edit-head">
                                <h4>Edit your review</h4>

                                <div className="edit-locked">
                                  <strong>{r.name}</strong>
                                  <Stars value={r.rating} />
                                </div>
                              </div>

                              <textarea
                                rows="4"
                                value={editComment}
                                maxLength={500}
                                autoFocus
                                placeholder="Update your comment..."
                                onChange={e => setEditComment(e.target.value)}
                              />

                              {editError && (
                                <div className="alert error review-msg">
                                  ⚠ {editError}
                                </div>
                              )}

                              <div className="review-edit-actions">
                                <small>{editComment.length}/500</small>

                                <div className="edit-btns">
                                  <button
                                    type="button"
                                    className="btn light"
                                    onClick={cancelEditReview}
                                  >
                                    Cancel
                                  </button>
                                  <button type="submit" className="btn primary">
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            </form>
                          );
                        }

                        // NORMAL VIEW
                        return (
                          <div className="review-item" key={r.id}>
                            <div className="author-avatar small">
                              {r.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="review-main">
                              <div className="review-top">
                                <strong>{r.name}</strong>
                                <Stars value={r.rating} />
                                <small>{formatDate(r.createdAt)}</small>
                                {r.editedAt && (
                                  <small className="edited-tag">(edited)</small>
                                )}
                                {mine && <span className="you-tag">You</span>}
                              </div>

                              <p>{r.comment}</p>
                            </div>

                            {mine && (
                              <div className="review-menu">
                                <button
                                  type="button"
                                  className={
                                    menuOpenId === r.id
                                      ? 'dots-btn open'
                                      : 'dots-btn'
                                  }
                                  aria-label="Review options"
                                  aria-haspopup="menu"
                                  aria-expanded={menuOpenId === r.id}
                                  onClick={() => toggleMenu(r.id)}
                                >
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </button>

                                {menuOpenId === r.id && (
                                  <div className="dots-dropdown" role="menu">
                                    <button
                                      type="button"
                                      role="menuitem"
                                      className="dots-item"
                                      onClick={() => startEditReview(r)}
                                    >
                                      <span className="dots-icon">✎</span>
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      role="menuitem"
                                      className="dots-item danger"
                                      onClick={() => deleteReview(r)}
                                    >
                                      <span className="dots-icon">🗑</span>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              )}

              {/* ========== Q&A TAB ========== */}
              {tab === 'qa' && (
                <section className="reviews qa">
                  {/* ASK FORM */}
                  <form className="review-form" onSubmit={submitQuestion}>
                    <h4>Ask a question about this blog</h4>

                    <input
                      type="text"
                      placeholder="Your name *"
                      value={qName}
                      maxLength={40}
                      onChange={e => setQName(e.target.value)}
                    />

                    <textarea
                      rows="3"
                      placeholder="What would you like to ask the author or readers?"
                      value={qText}
                      maxLength={300}
                      onChange={e => setQText(e.target.value)}
                    />

                    {qMsg.text && (
                      <div className={`alert ${qMsg.type} review-msg`}>
                        {qMsg.type === 'success' ? '✓ ' : '⚠ '}
                        {qMsg.text}
                      </div>
                    )}

                    <div className="review-foot">
                      <small>{qText.length}/300</small>
                      <button type="submit" className="btn primary">
                        Post Question →
                      </button>
                    </div>
                  </form>

                  {/* QUESTION LIST */}
                  <div className="review-list">
                    {activeQuestions.length === 0 ? (
                      <p className="no-reviews">
                        No questions yet. Ask the first one!
                      </p>
                    ) : (
                      activeQuestions.map(q => {
                        const answers = q.answers || [];

                        return (
                          <div className="qa-item" key={q.id}>
                            <div className="qa-question">
                              <span className="qa-badge q">Q</span>

                              <div className="qa-body">
                                <div className="review-top">
                                  <strong>{q.name}</strong>
                                  <small>{formatDate(q.createdAt)}</small>
                                  {q.ownerId === clientId && (
                                    <span className="you-tag">You</span>
                                  )}
                                </div>

                                <p>{q.text}</p>

                                <div className="qa-actions">
                                  <button
                                    type="button"
                                    className="link-btn"
                                    onClick={() => openReply(q.id)}
                                  >
                                    {replyOpenId === q.id
                                      ? 'Cancel'
                                      : `Answer${
                                          answers.length
                                            ? ` (${answers.length})`
                                            : ''
                                        }`}
                                  </button>

                                  {q.ownerId === clientId && (
                                    <button
                                      type="button"
                                      className="link-btn danger"
                                      onClick={() => deleteQuestion(q)}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ANSWERS */}
                            {answers.length > 0 && (
                              <div className="qa-answers">
                                {answers.map(a => (
                                  <div className="qa-answer" key={a.id}>
                                    <span className="qa-badge a">A</span>

                                    <div className="qa-body">
                                      <div className="review-top">
                                        <strong>{a.name}</strong>
                                        <small>{formatDate(a.createdAt)}</small>
                                        {a.ownerId === clientId && (
                                          <span className="you-tag">You</span>
                                        )}
                                      </div>

                                      <p>{a.text}</p>

                                      {a.ownerId === clientId && (
                                        <div className="qa-actions">
                                          <button
                                            type="button"
                                            className="link-btn danger"
                                            onClick={() => deleteAnswer(q.id, a)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* REPLY FORM */}
                            {replyOpenId === q.id && (
                              <form
                                className="qa-reply-form"
                                onSubmit={e => submitAnswer(e, q.id)}
                              >
                                <input
                                  type="text"
                                  placeholder="Your name *"
                                  value={aName}
                                  maxLength={40}
                                  onChange={e => setAName(e.target.value)}
                                />

                                <textarea
                                  rows="3"
                                  placeholder="Write your answer..."
                                  value={aText}
                                  maxLength={400}
                                  autoFocus
                                  onChange={e => setAText(e.target.value)}
                                />

                                {aError && (
                                  <div className="alert error review-msg">
                                    ⚠ {aError}
                                  </div>
                                )}

                                <div className="review-edit-actions">
                                  <small>{aText.length}/400</small>
                                  <button type="submit" className="btn primary">
                                    Post Answer
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}