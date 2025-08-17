import { Link } from "react-router"

function App(): React.JSX.Element {

  return (
    <div className="text-primary">
      Welcome to Streamly
      <Link to="/player/?dev=true">Dev</Link>
    </div>
  )
}

export default App
