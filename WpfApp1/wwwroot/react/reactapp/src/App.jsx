
import { useNavigation } from './useNavigation.jsx';

import SideMenu from './SideMenu.jsx';
import './App.css';

function App() {
  const { currentPage, currentPageComponent, navigate } = useNavigation();
  const CurrentPage = currentPageComponent;

  return (
    <div className="flex h-screen overflow-hidden m-0 p-0">
      {/* SideMenu - fixed left, full height, no margins */}
      <SideMenu currentPage={currentPage} onPageChange={navigate} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden m-0">

        
        {/* Main content area - dynamic page content */}
        <main className="flex-1 overflow-y-auto p-6 m-0">
          <CurrentPage />
        </main>
      </div>
    </div>
  );
}

export default App;
