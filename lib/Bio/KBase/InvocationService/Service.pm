package Bio::KBase::InvocationService::Service;

use Data::Dumper;
use Moose;
use Bio::KBase::AuthToken;

extends 'RPC::Any::Server::JSONRPC::PSGI';

has 'instance_dispatch' => (is => 'ro', isa => 'HashRef');
has 'user_auth' => (is => 'ro', isa => 'UserAuth');
has 'valid_methods' => (is => 'ro', isa => 'HashRef', lazy => 1,
			builder => '_build_valid_methods');

our $CallContext;

our %return_counts = (
        'start_session' => 1,
        'list_files' => 2,
        'remove_files' => 0,
        'rename_file' => 0,
        'copy' => 0,
        'make_directory' => 0,
        'remove_directory' => 0,
        'change_directory' => 1,
        'put_file' => 0,
        'get_file' => 1,
        'run_pipeline' => 2,
        'run_pipeline2' => 3,
        'exit_session' => 0,
        'valid_commands' => 1,
        'installed_modules' => 1,
        'get_tutorial_text' => 3,
        'version' => 1,
);

our %method_authentication = (
        'start_session' => 'optional',
        'list_files' => 'optional',
        'remove_files' => 'optional',
        'rename_file' => 'optional',
        'copy' => 'optional',
        'make_directory' => 'optional',
        'remove_directory' => 'optional',
        'change_directory' => 'optional',
        'put_file' => 'optional',
        'get_file' => 'optional',
        'run_pipeline' => 'optional',
        'run_pipeline2' => 'optional',
        'exit_session' => 'optional',
        'valid_commands' => 'optional',
        'installed_modules' => 'optional',
        'get_tutorial_text' => 'optional',
);


sub _build_valid_methods
{
    my($self) = @_;
    my $methods = {
        'start_session' => 1,
        'list_files' => 1,
        'remove_files' => 1,
        'rename_file' => 1,
        'copy' => 1,
        'make_directory' => 1,
        'remove_directory' => 1,
        'change_directory' => 1,
        'put_file' => 1,
        'get_file' => 1,
        'run_pipeline' => 1,
        'run_pipeline2' => 1,
        'exit_session' => 1,
        'valid_commands' => 1,
        'installed_modules' => 1,
        'get_tutorial_text' => 1,
        'version' => 1,
    };
    return $methods;
}

sub call_method {
    my ($self, $data, $method_info) = @_;

    my ($module, $method) = @$method_info{qw(module method)};
    
    my $ctx = Bio::KBase::InvocationService::ServiceContext->new(client_ip => $self->_plack_req->address);
    
    my $args = $data->{arguments};

{
    # Service InvocationService requires authentication.

    my $method_auth = $method_authentication{$method};
    $ctx->authenticated(0);
    if ($method_auth eq 'none')
    {
	# No authentication required here. Move along.
    }
    else
    {
	my $token = $self->_plack_req->header("Authorization");

	if (!$token && $method_auth eq 'required')
	{
	    $self->exception('PerlError', "Authentication required for InvocationService but no authentication header was passed");
	}

	my $auth_token = Bio::KBase::AuthToken->new(token => $token, ignore_authrc => 1);
	my $valid = $auth_token->validate();
	# Only throw an exception if authentication was required and it fails
	if ($method_auth eq 'required' && !$valid)
	{
	    $self->exception('PerlError', "Token validation failed: " . $auth_token->error_message);
	} elsif ($valid) {
	    $ctx->authenticated(1);
	    $ctx->user_id($auth_token->user_id);
	    $ctx->token( $token);
	}
    }
}
    
    my $new_isa = $self->get_package_isa($module);
    no strict 'refs';
    local @{"${module}::ISA"} = @$new_isa;
    local $CallContext = $ctx;
    my @result;
    {
	my $err;
	eval {
	    @result = $module->$method(@{ $data->{arguments} });
	};
	if ($@)
	{
	    #
	    # Reraise the string version of the exception because
	    # the RPC lib can't handle exception objects (yet).
	    #
	    my $err = $@;
	    my $str = "$err";
	    $str =~ s/Bio::KBase::CDMI::Service::call_method.*//s;
	    $str =~ s/^/>\t/mg;
	    die "The JSONRPC server invocation of the method \"$method\" failed with the following error:\n" . $str;
	}
    }
    my $result;
    if ($return_counts{$method} == 1)
    {
        $result = [[$result[0]]];
    }
    else
    {
        $result = \@result;
    }
    return $result;
}


sub get_method
{
    my ($self, $data) = @_;
    
    my $full_name = $data->{method};
    
    $full_name =~ /^(\S+)\.([^\.]+)$/;
    my ($package, $method) = ($1, $2);
    
    if (!$package || !$method) {
	$self->exception('NoSuchMethod',
			 "'$full_name' is not a valid method. It must"
			 . " contain a package name, followed by a period,"
			 . " followed by a method name.");
    }

    if (!$self->valid_methods->{$method})
    {
	$self->exception('NoSuchMethod',
			 "'$method' is not a valid method in service InvocationService.");
    }
	
    my $inst = $self->instance_dispatch->{$package};
    my $module;
    if ($inst)
    {
	$module = $inst;
    }
    else
    {
	$module = $self->get_module($package);
	if (!$module) {
	    $self->exception('NoSuchMethod',
			     "There is no method package named '$package'.");
	}
	
	Class::MOP::load_class($module);
    }
    
    if (!$module->can($method)) {
	$self->exception('NoSuchMethod',
			 "There is no method named '$method' in the"
			 . " '$package' package.");
    }
    
    return { module => $module, method => $method };
}

package Bio::KBase::InvocationService::ServiceContext;

use strict;

=head1 NAME

Bio::KBase::InvocationService::ServiceContext

head1 DESCRIPTION

A KB RPC context contains information about the invoker of this
service. If it is an authenticated service the authenticated user
record is available via $context->user. The client IP address
is available via $context->client_ip.

=cut

use base 'Class::Accessor';

__PACKAGE__->mk_accessors(qw(user_id client_ip authenticated token));

sub new
{
    my($class, %opts) = @_;
    
    my $self = {
	%opts,
    };
    return bless $self, $class;
}

1;
