import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Employer from './pages/Employer';
import Employee from './pages/Employee';
import Auditor from './pages/Auditor';

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/employer" element={<Employer />} />
              <Route path="/employee" element={<Employee />} />
              <Route path="/auditor" element={<Auditor />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}
