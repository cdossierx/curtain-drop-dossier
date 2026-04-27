import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { TRPCProvider } from "../providers/trpc"
import { Toaster } from "../ui/sonner"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <App />
        <Toaster />
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
)
