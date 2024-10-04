import { Dimensions, StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        flex: 1, // Ensure the video takes up all available space inside the parent
    },
    postinfo: {
        position: 'absolute',
        left: 33,
        bottom: 140,
        right: 0,
        width: "70%",
        zIndex: 10
    },
    commentSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ecf0f1',
        padding: 10,
        height: '75%',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    commentInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 10,
    },
    // ... other styles ...
});

export default styles;