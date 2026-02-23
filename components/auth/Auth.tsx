import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import SignIn from "./SignIn"
import SignUp from "./SignUp"

const Auth = () => {
    return (
        <Tabs defaultValue="sign-in" className="w-full max-w-md mx-auto mt-15 dark">
            <TabsList className="flex justify-center w-full mx-auto mb-1 gap-1">
                <TabsTrigger value="sign-in" className="text-xl p-4" >Sign In</TabsTrigger>
                <TabsTrigger value="sign-up" className="text-xl p-4">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in"><SignIn /></TabsContent>
            <TabsContent value="sign-up"><SignUp /></TabsContent>
        </Tabs>
    )
}  

export default Auth