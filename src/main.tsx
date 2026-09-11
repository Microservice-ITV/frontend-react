// 1. Third-party library imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

// 2. Absolute imports
import { store } from '@/app/store'
import { initCartSync } from '@/app/bootstrap'
import { GlobalModalProvider } from '@/components/ui/GlobalModalProvider'
import App from './App'

// 3. Relative imports (styles)
import './styles/global.css'
import './index.css'

// initialize global side effects
initCartSync(store.dispatch)

createRoot(document.getElementById('root')!).render(
  <StrictMode> {/* development-only tool, highlighting potential */ }
    {/* 1. Entire application state is stored in one object called the store */}
    {/* 2. Without Provider, React components cannot interact with Redux. */}
    <Provider store={store}>
      <BrowserRouter>
        <GlobalModalProvider>
          <App />
        </GlobalModalProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
)