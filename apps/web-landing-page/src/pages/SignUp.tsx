import React from "react"
import { Link } from "react-router-dom"

import Header from "@refly-packages/ai-workspace-common/components/landing-page-partials/Header"
import PageIllustration from "@refly-packages/ai-workspace-common/components/landing-page-partials/PageIllustration"
import Banner from "@refly-packages/ai-workspace-common/components/landing-page-partials/Banner"

function SignUp() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      {/*  Site header */}
      <Header />

      {/*  Page content */}
      <main className="grow">
        {/*  Page illustration */}
        <div
          className="pointer-events-none relative mx-auto h-0 max-w-6xl"
          aria-hidden="true">
          <PageIllustration />
        </div>

        <section className="relative">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="pb-12 pt-32 md:pb-20 md:pt-40">
              {/* Page header */}
              <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
                <h1 className="h1">
                  Welcome. We exist to make entrepreneurship easier.
                </h1>
              </div>

              {/* Form */}
              <div className="mx-auto max-w-sm">
                <form>
                  <div className="-mx-3 flex flex-wrap">
                    <div className="w-full px-3">
                      <button className="btn relative flex w-full items-center bg-red-600 px-0 text-white hover:bg-red-700">
                        <svg
                          className="mx-4 h-4 w-4 shrink-0 fill-current text-white opacity-75"
                          viewBox="0 0 16 16"
                          xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.9 7v2.4H12c-.2 1-1.2 3-4 3-2.4 0-4.3-2-4.3-4.4 0-2.4 2-4.4 4.3-4.4 1.4 0 2.3.6 2.8 1.1l1.9-1.8C11.5 1.7 9.9 1 8 1 4.1 1 1 4.1 1 8s3.1 7 7 7c4 0 6.7-2.8 6.7-6.8 0-.5 0-.8-.1-1.2H7.9z" />
                        </svg>
                        <span
                          className="mr-4 flex h-6 items-center border-r border-white border-opacity-25"
                          aria-hidden="true"></span>
                        <span className="-ml-16 flex-auto pl-16 pr-8">
                          Sign up with Google
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
                <div className="my-6 flex items-center">
                  <div
                    className="mr-3 grow border-t border-dotted border-gray-700"
                    aria-hidden="true"></div>
                  <div className="text-gray-400">
                    Or, register with your email
                  </div>
                  <div
                    className="ml-3 grow border-t border-dotted border-gray-700"
                    aria-hidden="true"></div>
                </div>
                <form>
                  <div className="-mx-3 mb-4 flex flex-wrap">
                    <div className="w-full px-3">
                      <label
                        className="mb-1 block text-sm font-medium text-gray-300"
                        htmlFor="full-name">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="full-name"
                        type="text"
                        className="form-input w-full text-gray-300"
                        placeholder="First and last name"
                        required
                      />
                    </div>
                  </div>
                  <div className="-mx-3 mb-4 flex flex-wrap">
                    <div className="w-full px-3">
                      <label
                        className="mb-1 block text-sm font-medium text-gray-300"
                        htmlFor="company-name">
                        Company Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="company-name"
                        type="text"
                        className="form-input w-full text-gray-300"
                        placeholder="Your company or app name"
                        required
                      />
                    </div>
                  </div>
                  <div className="-mx-3 mb-4 flex flex-wrap">
                    <div className="w-full px-3">
                      <label
                        className="mb-1 block text-sm font-medium text-gray-300"
                        htmlFor="email">
                        Work Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="form-input w-full text-gray-300"
                        placeholder="you@yourcompany.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="-mx-3 mb-4 flex flex-wrap">
                    <div className="w-full px-3">
                      <label
                        className="mb-1 block text-sm font-medium text-gray-300"
                        htmlFor="password">
                        Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="password"
                        type="password"
                        className="form-input w-full text-gray-300"
                        placeholder="Password (at least 10 characters)"
                        required
                      />
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    I agree to be contacted by Open PRO about this offer as per
                    the Open PRO{" "}
                    <Link
                      to="#"
                      className="text-gray-400 underline transition duration-150 ease-in-out hover:text-gray-200 hover:no-underline">
                      Privacy Policy
                    </Link>
                    .
                  </div>
                  <div className="-mx-3 mt-6 flex flex-wrap">
                    <div className="w-full px-3">
                      <button className="btn w-full bg-purple-600 text-white hover:bg-purple-700">
                        Sign up
                      </button>
                    </div>
                  </div>
                </form>
                <div className="mt-6 text-center text-gray-400">
                  Already using Open PRO?{" "}
                  <Link
                    to="signin"
                    className="text-purple-600 transition duration-150 ease-in-out hover:text-gray-200">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default SignUp
