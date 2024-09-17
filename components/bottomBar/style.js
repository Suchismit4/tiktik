import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
        height: 70,
        paddingLeft: 35,
        
        paddingRight: 35,
        paddingBottom: 0,
    },
    iconsHolder: {
        padding: 0,
        margin: 0,
        marginTop: 11,
        
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
    },
    icons: {
        width: 35,
        height: 35
    },
    iconHolder: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center'
    },
    title: {        
        fontFamily: "ClashDisplay",
        fontSize: 12,
        fontWeight: 100,
        marginTop: 5,
        color: "#ddd"
    }
})

export default styles;