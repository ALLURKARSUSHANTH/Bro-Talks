import { Provider } from 'react-redux'
import store from './reduxState/store'
import { ThemeProviderWrapper } from './Theme/toggleTheme'
import Routes from './components/Routes'
import { SocketProvider } from './context/SocketContext'

function App() {

  return (
    <Provider store={store}>
    <ThemeProviderWrapper>
      <SocketProvider>
      <Routes/>
      </SocketProvider>
    </ThemeProviderWrapper>
    </Provider>
  )
}

export default App
