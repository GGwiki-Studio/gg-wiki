import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import SignInForm from "./SignInForm"

const SignIn = () => {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-xl font-bold">If You Have An Account, Use It.</CardTitle>
            <CardDescription>Sign in to access your saved strategies and preferences</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <SignInForm />
        </CardContent>
    </Card>
  )
}

export default SignIn