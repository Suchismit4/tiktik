import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: 30,
        paddingRight: 30,
        paddingTop: 15,
        justifyContent: "space-between",
        alignItems: 'center'
    },
    icons: {
        width: 35,
        height: 35,
    },
    logo: {
        fontFamily: 'ClashDisplay',
        fontSize: 25,
        color: "#ffff"
    }
})

export default styles;