import { Route, Routes } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import EmailConfirmation from "./pages/EmailConfirmation";
import FindTeam from "./pages/FindTeam";

export const uri = "http://127.0.0.1:8000/";

function App() {
  return (
    <>
      <Navbar></Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/CreateAccount" element={<CreateAccount />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/FindTeam" element={<FindTeam />} />
        <Route path="/EmailConfirmation" element={<EmailConfirmation />} />
      </Routes>
    </>
  );
}

export default App;
