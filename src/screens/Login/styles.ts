/**
 * Login Screen Styles
 * 
 * Defines the styling for the Login screen.
 */
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  logoContainer: { 
    marginBottom: 30,
  },
  logo: {
    fontFamily: 'ClashDisplay',
    fontSize: 28,
    color: "#000",
    textAlign: 'center',
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    color: "#000",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40
  },
  button: {
    backgroundColor: "#130f40",
    width: '100%',
    paddingHorizontal: 22.5,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center'
  },
  buttonOutline: {
    backgroundColor: "#ecf0f1",
    marginTop: 10,
    borderRadius: 5,
    borderColor: "#130f40",
    borderWidth: 1,
  },
  buttonText: {
    color: "#fff",
    fontWeight: '700',
    fontSize: 15,
  },
  buttonOutlineText: {
    color: "#130f40",
    fontWeight: '600',
    fontSize: 15,
  }
});

export default styles; 