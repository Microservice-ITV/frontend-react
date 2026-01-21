// 1. Third-party library imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

// 2. Absolute imports
import { store } from '@/app/store'
import App from './App'

// 3. Relative imports (styles)
import './styles/fonts.css' // Import custom fonts
import './styles/global.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
)