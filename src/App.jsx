import { useState, useEffect } from "react"
import "./App.css"

const App = () => {
  // ============ STATE'LER ============
  // localStorage'dan veri çekmeyi dene, yoksa boş dizi kullan
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("todos")
    return saved ? JSON.parse(saved) : []
  })
  
  const [inputValue, setInputValue] = useState("")
  const [dueDate, setDueDate] = useState("")           // Son tarih
  const [priority, setPriority] = useState("normal")   // Öncelik
  const [filter, setFilter] = useState("all")          // Filtre: all, active, completed
  const [editingId, setEditingId] = useState(null)     // Düzenlenen görev ID'si
  const [editText, setEditText] = useState("")         // Düzenleme metni

  // ============ useEffect - localStorage'a Kaydet ============
  // todos her değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos))
  }, [todos])

  // ============ YARDIMCI FONKSİYONLAR ============
  
  // Tarihi formatla (22 Ocak 2026 gibi)
  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  // Tarihin geçip geçmediğini kontrol et
  const isOverdue = (dateString) => {
    if (!dateString) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(dateString)
    return dueDate < today
  }

  // Bugün kontrolü
  const isToday = (dateString) => {
    if (!dateString) return false
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  // ============ CRUD FONKSİYONLARI ============
  
  // Yeni görev ekle
  const addTodo = () => {
    if (inputValue.trim() === "") return
    
    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      createdAt: new Date().toISOString(),  // Oluşturulma tarihi
      dueDate: dueDate || null,              // Son tarih
      priority: priority                      // Öncelik
    }
    
    setTodos([...todos, newTodo])
    setInputValue("")
    setDueDate("")
    setPriority("normal")
  }

  // Görev sil
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // Tamamlama durumunu değiştir
  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  // Düzenleme modunu aç
  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  // Düzenlemeyi kaydet
  const saveEdit = (id) => {
    if (editText.trim() === "") return
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: editText } : todo
    ))
    setEditingId(null)
    setEditText("")
  }

  // Düzenlemeyi iptal et
  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  // Enter tuşu kontrolü
  const handleKeyPress = (e) => {
    if (e.key === "Enter") addTodo()
  }

  const handleEditKeyPress = (e, id) => {
    if (e.key === "Enter") saveEdit(id)
    if (e.key === "Escape") cancelEdit()
  }

  // Tümünü temizle
  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  // ============ FİLTRELEME ============
  const filteredTodos = todos.filter(todo => {
    if (filter === "active") return !todo.completed
    if (filter === "completed") return todo.completed
    return true
  })

  // Önceliğe göre sırala (high > normal > low)
  const priorityOrder = { high: 0, normal: 1, low: 2 }
  const sortedTodos = [...filteredTodos].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )

  // ============ İSTATİSTİKLER ============
  const totalCount = todos.length
  const completedCount = todos.filter(t => t.completed).length
  const activeCount = totalCount - completedCount
  const overdueCount = todos.filter(t => !t.completed && isOverdue(t.dueDate)).length

  // ============ JSX ============
  return (
    <div className="app">
      <h1>📝 Todo List</h1>
      
      {/* Ekleme Formu */}
      <div className="add-form">
        <div className="input-row">
          <input
            type="text"
            placeholder="Yeni görev ekle..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="main-input"
          />
          <button onClick={addTodo} className="add-btn">Ekle</button>
        </div>
        
        <div className="options-row">
          <div className="option">
            <label>📅 Son Tarih:</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="option">
            <label>⚡ Öncelik:</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Düşük</option>
              <option value="normal">Normal</option>
              <option value="high">Yüksek</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtre Butonları */}
      <div className="filters">
        <button 
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tümü ({totalCount})
        </button>
        <button 
          className={filter === "active" ? "active" : ""}
          onClick={() => setFilter("active")}
        >
          Aktif ({activeCount})
        </button>
        <button 
          className={filter === "completed" ? "active" : ""}
          onClick={() => setFilter("completed")}
        >
          Tamamlanan ({completedCount})
        </button>
      </div>

      {/* Görev Listesi */}
      <ul className="todo-list">
        {sortedTodos.length === 0 ? (
          <li className="empty-state">
            {filter === "all" ? "🎉 Henüz görev yok. Bir tane ekle!" : 
             filter === "active" ? "✅ Tüm görevler tamamlandı!" :
             "📋 Henüz tamamlanan görev yok"}
          </li>
        ) : (
          sortedTodos.map(todo => (
            <li 
              key={todo.id} 
              className={`
                ${todo.completed ? "completed" : ""} 
                ${isOverdue(todo.dueDate) && !todo.completed ? "overdue" : ""}
                priority-${todo.priority}
              `}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete(todo.id)}
              />
              
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
                      {/* Öncelik etiketi */}
                      <span className={`priority-badge ${todo.priority}`}>
                        {todo.priority === "high" ? "🔴 Yüksek" : 
                         todo.priority === "low" ? "🟢 Düşük" : "🟡 Normal"}
                      </span>
                      
                      {/* Son tarih */}
                      {todo.dueDate && (
                        <span className={`due-date ${isOverdue(todo.dueDate) && !todo.completed ? "overdue" : ""} ${isToday(todo.dueDate) ? "today" : ""}`}>
                          📅 {isToday(todo.dueDate) ? "Bugün" : formatDate(todo.dueDate)}
                          {isOverdue(todo.dueDate) && !todo.completed && " ⚠️"}
                        </span>
                      )}
                      
                      {/* Oluşturulma tarihi */}
                      <span className="created-date">
                        🕐 {formatDate(todo.createdAt.split('T')[0])}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="todo-actions">
                {editingId === todo.id ? (
                  <>
                    <button onClick={() => saveEdit(todo.id)} className="save-btn">✓</button>
                    <button onClick={cancelEdit} className="cancel-btn">✕</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(todo)} className="edit-btn">✏️</button>
                    <button onClick={() => deleteTodo(todo.id)} className="delete-btn">🗑️</button>
                  </>
                )}
              </div>
            </li>
          ))
        )}
      </ul>

      {/* İstatistikler */}
      <div className="stats">
        <div className="stat-item">
          <span className="stat-number">{totalCount}</span>
          <span className="stat-label">Toplam</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{activeCount}</span>
          <span className="stat-label">Aktif</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{completedCount}</span>
          <span className="stat-label">Tamamlanan</span>
        </div>
        {overdueCount > 0 && (
          <div className="stat-item overdue">
            <span className="stat-number">{overdueCount}</span>
            <span className="stat-label">Gecikmiş</span>
          </div>
        )}
      </div>

      {/* Tamamlananları Temizle */}
      {completedCount > 0 && (
        <button onClick={clearCompleted} className="clear-btn">
          🧹 Tamamlananları Temizle
        </button>
      )}
    </div>
  )
}

export default App
