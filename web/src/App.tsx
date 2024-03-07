import "./App.css"

import { Router } from "./router/index"
import { AppLayout } from "@/components/layout/index"

const App = () => <Router layout={AppLayout} />

export default App
