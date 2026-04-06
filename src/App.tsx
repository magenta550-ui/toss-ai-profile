import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Loading from './pages/Loading';
import Crop from './pages/Crop';
import Result from './pages/Result';

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-white min-h-screen text-toss-gray-900 overflow-x-hidden font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/crop" element={<Crop />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
