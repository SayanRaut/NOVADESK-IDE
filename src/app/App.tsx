import { ThemeProvider } from '../contexts/ThemeContext';
import { LayoutProvider } from '../contexts/LayoutContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { AIProvider } from '../contexts/AIContext';
import { UIProvider } from '../contexts/UIContext';
import { EditorProvider } from '../contexts/EditorContext';
import { WindowProvider } from '../contexts/WindowContext';
import { PanelProvider } from '../contexts/PanelContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { TerminalProvider } from '../contexts/TerminalContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ExtensionProvider } from '../contexts/ExtensionContext';
import { DesktopLayout } from '../layouts/DesktopLayout';
import { LoadingScreen } from '../pages/LoadingScreen';
import { LoginPage } from '../pages/LoginPage';

function AppRouter() {
  const { isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;
  
  return <DesktopLayout />;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <WindowProvider>
            <LayoutProvider>
              <SidebarProvider>
                <ExtensionProvider>
                  <PanelProvider>
                    <NotificationProvider>
                      <TerminalProvider>
                        <EditorProvider>
                          <AIProvider>
                            <AppRouter />
                          </AIProvider>
                        </EditorProvider>
                      </TerminalProvider>
                    </NotificationProvider>
                  </PanelProvider>
                </ExtensionProvider>
              </SidebarProvider>
            </LayoutProvider>
          </WindowProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
