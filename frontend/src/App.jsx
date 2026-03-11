import "./App.css";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Game from "./game/Game";

function App() {

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/game/:roomId" element={<Game />} />
    </Routes>
  );
}

export default App;
