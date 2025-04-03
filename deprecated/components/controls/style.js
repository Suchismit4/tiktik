import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 25,
        bottom: 143,
        zIndex: 10
    },
    button: {
        width: 40,
        height: 40,
        marginTop: 28
    },
    containerIcon: {
        flexDirection: 'column',    // Place items in a column
        alignItems: 'center',       // Center items horizontally
        justifyContent: 'center'    // Optional: Center items vertically if there's extra space
    },
    iconText: {
        fontSize: 13,                  // Adjust based on your preference
        fontWeight: 'bold',
        color: '#ECF0F1',
        marginTop: 5                 // A dark gray color for simplicity
    },
})

export default styles;