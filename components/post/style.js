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
    }
    // ... other styles ...
});

export default styles;