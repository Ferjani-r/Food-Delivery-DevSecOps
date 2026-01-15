import { StoreContext } from '../context/StoreContext';

export const mockStoreContext = {
  food_list: [],
  cartItems: {},
  setCartItems: () => {},

  addToCart: () => {},
  removeFromCart: () => {},

  getTotalCartAmount: () => 0,

  token: null,
  setToken: () => {},

  url: 'http://localhost'
};

const StoreContextMockProvider = ({ children }) => {
  return (
    <StoreContext.Provider value={mockStoreContext}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextMockProvider;
