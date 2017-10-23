#pragma strict
@script RequireComponent( AudioSource )

public var thePlayer : Transform;
private var theEnemy : Transform;

public var speed : float = 5.0;

var isOffScreen : boolean = false;
public var offscreenDotRange : float = 0.7;

var isVisible : boolean = false;
public var visibleDotRange : float = 0.8; // ** between 0.75 and 0.85 (originally 0.8172719) 

var isInRange : boolean = false;

public var followDistance : float = 24.0;
public var maxVisibleDistance : float = 25.0;

public var reduceDistAmt : float = 3.1;

private var sqrDist : float = 0.0;

public var health : float = 100.0;
public var damage : float = 20.0;

public var enemySightedSFX : AudioClip;

private var hasPlayedSeenSound : boolean = false;

private var colDist : float = 5.0; // raycast distance in front of enemy when checking for obstacles


function Start() 
{
	if ( thePlayer == null )
	{
		thePlayer = GameObject.Find( "Player" ).transform;
	}
	
	theEnemy = transform;
}

function Update() 
{
	// Movement : check if out-of-view, then move
	CheckIfOffScreen();
	
	// if is Off Screen, move
	if ( isOffScreen )
	{
		MoveEnemy();
		
		// restore health
		RestoreHealth();
	}
	else
	{
		// check if Player is seen
		CheckIfVisible();
		
		if ( isVisible )
		{
			// deduct health
			DeductHealth();
			
			// stop moving
			StopEnemy();
			
			// play sound only when the Man is first sighted
			if ( !hasPlayedSeenSound )
			{
				GetComponent.<AudioSource>().PlayClipAtPoint( enemySightedSFX, thePlayer.position ); 
			}
			hasPlayedSeenSound = true; // sound has now played
		}
		else
		{
			// check max range
			CheckMaxVisibleRange();
			
			// if far away then move, else stop
			if ( !isInRange )
			{
				MoveEnemy();
			}
			else
			{
				StopEnemy();
			}
			
			// reset hasPlayedSeenSound for next time isVisible first occurs
			hasPlayedSeenSound = false;
		}
	}
	
}


function DeductHealth() 
{
	// deduct health
	health -= damage * Time.deltaTime;
	
	// check if no health left
	if ( health <= 0.0 )
	{
		health = 0.0;
		Debug.Log( "YOU ARE OUT OF HEALTH !" );
		
		// Restart game here!
		Application.LoadLevel( "perdedor" );
	}
}


function RestoreHealth() 
{
	// deduct health
	health += damage * Time.deltaTime;
	
	// check if no health left
	if ( health >= 100.0 )
	{
		health = 100.0;
		//Debug.Log( "HEALTH is FULL" );
	}
}


function CheckIfOffScreen() 
{
	var fwd : Vector3 = thePlayer.forward.normalized;
	var other : Vector3 = (theEnemy.position - thePlayer.position).normalized;
	
	var theProduct : float = Vector3.Dot( fwd, other );
	
	if ( theProduct < offscreenDotRange )
	{
		isOffScreen = true;
	}
	else
	{
		isOffScreen = false;
	}
}


function MoveEnemy() 
{
	// Check the Follow Distance
	CheckDistance();
	
	// if not too close, move
	if ( !isInRange )
	{
		GetComponent.<Rigidbody>().velocity = Vector3( 0, GetComponent.<Rigidbody>().velocity.y, 0 ); // maintain gravity
		
		// --
		// Old Movement
		//transform.LookAt( thePlayer );		
		//transform.position += transform.forward * speed * Time.deltaTime;
		// --
		
		// New Movement - with obstacle avoidance
		var dir : Vector3 = ( thePlayer.position - theEnemy.position ).normalized;
		var hit : RaycastHit;
		
		if ( Physics.Raycast( theEnemy.position, theEnemy.forward, hit, colDist ) )
		{
			//Debug.Log( " obstacle ray hit " + hit.collider.gameObject.name );
			if ( hit.collider.gameObject.name != "Player" && hit.collider.gameObject.name != "Terrain" )
			{			
				dir += hit.normal * 20;
			}
		}
	
		var rot : Quaternion = Quaternion.LookRotation( dir );
	
		theEnemy.rotation = Quaternion.Slerp( theEnemy.rotation, rot, Time.deltaTime );
		theEnemy.position += theEnemy.forward * speed * Time.deltaTime;
		//theEnemy.rigidbody.velocity = theEnemy.forward * speed; // Not Working
		
		// --
	}
	else
	{
		StopEnemy();
	}
}


function StopEnemy() 
{
	transform.LookAt( thePlayer );
	
	GetComponent.<Rigidbody>().velocity = Vector3.zero;
}


function CheckIfVisible() 
{
	var fwd : Vector3 = thePlayer.forward.normalized;
	var other : Vector3 = ( theEnemy.position - thePlayer.position ).normalized;
	
	var theProduct : float = Vector3.Dot( fwd, other );
	
	if ( theProduct > visibleDotRange )
	{
		// Check the Max Distance
		CheckMaxVisibleRange();
		
		if ( isInRange )
		{
			// Linecast to check for occlusion
			var hit : RaycastHit;
			
			if ( Physics.Linecast( theEnemy.position + (Vector3.up * 1.75) + theEnemy.forward, thePlayer.position, hit ) )
			{
				Debug.Log( "Enemy sees " + hit.collider.gameObject.name );
				
				if ( hit.collider.gameObject.name == "Player" )
				{
					isVisible = true;
				}
			}
		}
		else
		{
			isVisible = false;
		}
	}
	else
	{
		isVisible = false;
	}
}


function CheckDistance() 
{
	var sqrDist : float = (theEnemy.position - thePlayer.position).sqrMagnitude;
	var sqrFollowDist : float = followDistance * followDistance;
	
	if ( sqrDist < sqrFollowDist )
	{
		isInRange = true;
	}
	else
	{
		isInRange = false;
	}	
}


function ReduceDistance() 
{
	followDistance -= reduceDistAmt;
}


function CheckMaxVisibleRange() 
{
	var sqrDist : float = (theEnemy.position - thePlayer.position).sqrMagnitude;
	var sqrMaxDist : float = maxVisibleDistance * maxVisibleDistance;
	
	if ( sqrDist < sqrMaxDist )
	{
		isInRange = true;
	}
	else
	{
		isInRange = false;
	}	
}



