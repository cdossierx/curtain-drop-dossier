import { Routes, Route } from 'react-router'
import Dashboard from './Dashboard'
import LogIncident from './LogIncident'
import Timeline from './Timeline'
import Intake from './Intake'
import Persons from './Persons'
import Aliases from './Aliases'
import Evidence from './Evidence'
import TagsPage from './Tags'
import Platforms from './Platforms'
import Analytics from './Analytics'
import Settings from './Settings'
import NotFound from "./NotFound"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: "" }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "An unexpected render error occurred." }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route render failed", error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <Card className="mx-auto mt-16 max-w-xl">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This page hit a recoverable rendering error instead of crashing the app.
            </p>
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">{this.state.message}</p>
            <Button onClick={() => this.setState({ hasError: false, message: "" })}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}

export default function App() {
  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogIncident />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/intake" element={<Intake />} />
        <Route path="/persons" element={<Persons />} />
        <Route path="/aliases" element={<Aliases />} />
        <Route path="/evidence" element={<Evidence />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/platforms" element={<Platforms />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </RouteErrorBoundary>
  )
}
