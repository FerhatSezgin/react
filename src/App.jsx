import { useState, useEffect, useCallback } from "react"
import "./App.css"

// Kategoriler
const CATEGORIES = [
  { id: "personal", name: "Kişisel", emoji: "👤", color: "#9b59b6" },
  { id: "work", name: "İş", emoji: "💼", color: "#3498db" },
  { id: "shopping", name: "Alışveriş", emoji: "🛒", color: "#e67e22" },
  { id: "health", name: "Sağlık", emoji: "💪", color: "#27ae60" },
  { id: "learning", name: "Öğrenme", emoji: "📚", color: "#e74c3c" }
]

const PRIORITIES = [
  { id: "low", name: "Düşük", emoji: "🟢" },
  { id: "normal", name: "Normal", emoji: "🟡" },
  { id: "high", name: "Yüksek", emoji: "🔴" }
]

const App = () => {
  // ============ STATE'LER ============
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("todos-pro")
    return saved ? JSON.parse(saved) : []
  })
  
  // 🗑️ ÇÖP KUTUSU - Silinen görevler burada
  const [trash, setTrash] = useState(() => {
    const saved = localStorage.getItem("todos-trash")
    return saved ? JSON.parse(saved) : []
  })
  
  // 🗑️ Çöp kutusu görünürlüğü
  const [showTrash, setShowTrash] = useState(false)
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode")
    return saved ? JSON.parse(saved) : window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  
  const [inputValue, setInputValue] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("normal")
  const [category, setCategory] = useState("personal")
  const [filter, setFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)

  // ============ EFFECTS ============
  useEffect(() => {
    localStorage.setItem("todos-pro", JSON.stringify(todos))
  }, [todos])

  // Çöp kutusunu localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem("todos-trash", JSON.stringify(trash))
  }, [trash])

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light")
  }, [darkMode])

  // ============ YARDIMCI FONKSİYONLAR ============
  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric", month: "short"
    })
  }

  const isOverdue = (dateString) => {
    if (!dateString) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateString) < today
  }

  const isToday = (dateString) => {
    if (!dateString) return false
    return dateString === new Date().toISOString().split('T')[0]
  }

  const getDaysLeft = (dateString) => {
    if (!dateString) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dateString)
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  // ============ CRUD FONKSİYONLARI ============
  const addTodo = useCallback(() => {
    if (inputValue.trim() === "") return
    
    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || null,
      priority,
      category
    }
    
    setTodos(prev => [...prev, newTodo])
    setInputValue("")
    setDueDate("")
    setPriority("normal")
  }, [inputValue, dueDate, priority, category])

  // 🗑️ Çöp kutusuna taşı (kalıcı silme değil)
  const moveToTrash = useCallback((id) => {
    const todoToTrash = todos.find(t => t.id === id)
    if (todoToTrash) {
      // Silinme zamanını ekle
      const trashedTodo = { ...todoToTrash, deletedAt: new Date().toISOString() }
      setTrash(prev => [...prev, trashedTodo])
      setTodos(prev => prev.filter(t => t.id !== id))
    }
  }, [todos])

  // 🗑️ Çöp kutusundan geri al
  const restoreFromTrash = useCallback((id) => {
    const todoToRestore = trash.find(t => t.id === id)
    if (todoToRestore) {
      // deletedAt'ı kaldır ve geri ekle
      const { deletedAt, ...restoredTodo } = todoToRestore
      setTodos(prev => [...prev, restoredTodo])
      setTrash(prev => prev.filter(t => t.id !== id))
    }
  }, [trash])

  // 🗑️ Kalıcı olarak sil
  const deletePermanently = useCallback((id) => {
    setTrash(prev => prev.filter(t => t.id !== id))
  }, [])

  // 🗑️ Çöp kutusunu boşalt
  const emptyTrash = useCallback(() => {
    if (trash.length > 0 && window.confirm(`${trash.length} görev kalıcı olarak silinecek. Emin misin?`)) {
      setTrash([])
    }
  }, [trash.length])

  // 🗑️ Tamamlananları çöp kutusuna taşı
  const moveCompletedToTrash = useCallback(() => {
    const completedTodos = todos.filter(t => t.completed)
    if (completedTodos.length === 0) return
    
    const trashedTodos = completedTodos.map(todo => ({
      ...todo,
      deletedAt: new Date().toISOString()
    }))
    
    setTrash(prev => [...prev, ...trashedTodos])
    setTodos(prev => prev.filter(t => !t.completed))
  }, [todos])

  const toggleComplete = useCallback((id) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        const newCompleted = !todo.completed
        if (newCompleted) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 2000)
        }
        return { ...todo, completed: newCompleted }
      }
      return todo
    }))
  }, [])

  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = useCallback((id) => {
    if (editText.trim() === "") return
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, text: editText } : todo
    ))
    setEditingId(null)
    setEditText("")
  }, [editText])

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTodo()
  }

  const handleEditKeyPress = (e, id) => {
    if (e.key === "Enter") saveEdit(id)
    if (e.key === "Escape") cancelEdit()
  }

  // ============ FİLTRELEME & SIRALAMA ============
  const filteredTodos = todos
    .filter(todo => {
      if (filter === "active") return !todo.completed
      if (filter === "completed") return todo.completed
      return true
    })
    .filter(todo => {
      if (categoryFilter !== "all") return todo.category === categoryFilter
      return true
    })
    .filter(todo => {
      if (searchQuery.trim()) {
        return todo.text.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })

  const priorityOrder = { high: 0, normal: 1, low: 2 }
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  // ============ İSTATİSTİKLER ============
  const totalCount = todos.length
  const completedCount = todos.filter(t => t.completed).length
  const activeCount = totalCount - completedCount
  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.dueDate)).length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }

  // Silinen görevin ne kadar önce silindiğini hesapla
  const getTimeAgo = (dateString) => {
    const now = new Date()
    const deleted = new Date(dateString)
    const diffMs = now - deleted
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return "Az önce"
    if (diffMins < 60) return `${diffMins} dk önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    return `${diffDays} gün önce`
  }

  // ============ JSX ============
  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      {/* Konfeti efekti */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="confetti" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: ['#667eea', '#764ba2', '#f39c12', '#27ae60', '#e74c3c'][Math.floor(Math.random() * 5)]
            }} />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="header">
        <h1>✨ Todo Pro</h1>
        <div className="header-actions">
          {/* 🗑️ Çöp kutusu butonu */}
          <button 
            className={`trash-toggle ${showTrash ? "active" : ""} ${trash.length > 0 ? "has-items" : ""}`}
            onClick={() => setShowTrash(!showTrash)}
            title="Çöp Kutusu"
          >
            🗑️
            {trash.length > 0 && <span className="trash-badge">{trash.length}</span>}
          </button>
          
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Açık Tema" : "Koyu Tema"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* 🗑️ ÇÖP KUTUSU PANELİ */}
      {showTrash && (
        <div className="trash-panel">
          <div className="trash-header">
            <h3>🗑️ Çöp Kutusu ({trash.length})</h3>
            {trash.length > 0 && (
              <button onClick={emptyTrash} className="empty-trash-btn">
                Boşalt
              </button>
            )}
          </div>
          
          {trash.length === 0 ? (
            <div className="trash-empty">
              <span>Çöp kutusu boş</span>
            </div>
          ) : (
            <ul className="trash-list">
              {trash.map(todo => (
                <li key={todo.id} className="trash-item">
                  <div className="trash-item-content">
                    <span className="trash-item-text">{todo.text}</span>
                    <span className="trash-item-time">{getTimeAgo(todo.deletedAt)}</span>
                  </div>
                  <div className="trash-item-actions">
                    <button 
                      onClick={() => restoreFromTrash(todo.id)} 
                      className="restore-btn"
                      title="Geri Al"
                    >
                      ↩️
                    </button>
                    <button 
                      onClick={() => deletePermanently(todo.id)} 
                      className="permanent-delete-btn"
                      title="Kalıcı Sil"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* İlerleme çubuğu */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="progress-text">
          {progressPercent}% tamamlandı ({completedCount}/{totalCount})
        </span>
      </div>

      {/* Ekleme Formu */}
      <div className="add-form">
        <div className="input-row">
          <input
            type="text"
            placeholder="Ne yapman gerekiyor?"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="main-input"
          />
          <button onClick={addTodo} className="add-btn">
            <span>+</span>
          </button>
        </div>
        
        <div className="options-row">
          <div className="option">
            <label>📅</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="option">
            <label>⚡</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>

          <div className="option">
            <label>📁</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Görev ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery("")}>✕</button>
        )}
      </div>

      {/* Filtre Butonları */}
      <div className="filter-section">
        <div className="filters">
          <button 
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Tümü
          </button>
          <button 
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Aktif
          </button>
          <button 
            className={filter === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
          >
            Bitti
          </button>
        </div>

        {/* Kategori Filtreleri */}
        <div className="category-filters">
          <button 
            className={`category-btn ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            Tümü
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`category-btn ${categoryFilter === c.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(c.id)}
              style={{ "--cat-color": c.color }}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Görev Listesi */}
      <ul className="todo-list">
        {sortedTodos.length === 0 ? (
          <li className="empty-state">
            <span className="empty-emoji">📋</span>
            <span>
              {searchQuery ? "Arama sonucu bulunamadı" : 
               filter === "all" ? "Görev listesi boş" : 
               filter === "active" ? "Tüm görevler tamamlandı!" :
               "Henüz tamamlanan görev yok"}
            </span>
          </li>
        ) : (
          sortedTodos.map(todo => {
            const catInfo = getCategoryInfo(todo.category)
            const daysLeft = getDaysLeft(todo.dueDate)
            
            return (
              <li 
                key={todo.id} 
                className={`
                  todo-item
                  ${todo.completed ? "completed" : ""} 
                  ${isOverdue(todo.dueDate) && !todo.completed ? "overdue" : ""}
                  priority-${todo.priority}
                `}
                style={{ "--cat-color": catInfo.color }}
              >
                <div className="category-indicator" title={catInfo.name} />
                
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleComplete(todo.id)}
                  />
                  <span className="checkmark" />
                </label>
                
                <div className="todo-content">
                  {editingId === todo.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleEditKeyPress(e, todo.id)}
                      autoFocus
                      className="edit-input"
                    />
                  ) : (
                    <>
                      <span className="todo-text">{todo.text}</span>
                      <div className="todo-meta">
                        <span className={`priority-badge ${todo.priority}`}>
                          {PRIORITIES.find(p => p.id === todo.priority)?.emoji}
                        </span>
                        
                        <span className="category-badge">
                          {catInfo.emoji} {catInfo.name}
                        </span>
                        
                        {todo.dueDate && (
                          <span className={`due-date ${isOverdue(todo.dueDate) && !todo.completed ? "overdue" : ""} ${isToday(todo.dueDate) ? "today" : ""}`}>
                            📅 {isToday(todo.dueDate) ? "Bugün" : formatDate(todo.dueDate)}
                            {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && !todo.completed && (
                              <span className="days-left"> ({daysLeft} gün)</span>
                            )}
                            {isOverdue(todo.dueDate) && !todo.completed && " ⚠️"}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="todo-actions">
                  {editingId === todo.id ? (
                    <>
                      <button onClick={() => saveEdit(todo.id)} className="action-btn save">✓</button>
                      <button onClick={cancelEdit} className="action-btn cancel">✕</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(todo)} className="action-btn edit">✏️</button>
                      {/* 🗑️ Çöp kutusuna taşı (kalıcı silme değil) */}
                      <button onClick={() => moveToTrash(todo.id)} className="action-btn delete">🗑️</button>
                    </>
                  )}
                </div>
              </li>
            )
          })
        )}
      </ul>

      {/* İstatistikler */}
      <div className="stats">
        <div className="stat-item">
          <span className="stat-number">{activeCount}</span>
          <span className="stat-label">Aktif</span>
        </div>
        <div className="stat-item completed-stat">
          <span className="stat-number">{completedCount}</span>
          <span className="stat-label">Bitti</span>
        </div>
        {overdueCount > 0 && (
          <div className="stat-item overdue-stat">
            <span className="stat-number">{overdueCount}</span>
            <span className="stat-label">Gecikmiş</span>
          </div>
        )}
      </div>

      {/* 🗑️ Tamamlananları Çöp Kutusuna Taşı */}
      {completedCount > 0 && (
        <button onClick={moveCompletedToTrash} className="clear-btn">
          🗑️ Tamamlananları Çöpe Taşı ({completedCount})
        </button>
      )}

      {/* Footer */}
      <footer className="footer">
        <span>React ile yapıldı 💜</span>
      </footer>
    </div>
  )
}

export default App
