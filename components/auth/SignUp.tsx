import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import SignUpForm from "./SignUpForm"

const SignUp = () => {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-xl font-bold">You Don't Have an Account Already?!</CardTitle>
            <CardDescription>Create an account to share your strategies with the world</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            <SignUpForm />
        </CardContent>
    </Card>
  )
}

export default SignUp