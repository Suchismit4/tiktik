import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    surveyContainer: {
        position: 'absolute',
        top: '30%', // Adjust as needed
        left: '10%',
        right: '10%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 999, // Ensure it appears above all elements
        alignItems: 'center',
      },
      surveyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      surveyQuestion: {
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center',
      },
      surveyOptions: {
        marginTop: 10,
        width: '100%', // Make options container take full width
      },
      // Added styles based on usage in the component
      surveyOptionButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center',
      },
      surveyOptionText: {
        color: 'white',
        fontSize: 16,
      },
});

export default styles; 